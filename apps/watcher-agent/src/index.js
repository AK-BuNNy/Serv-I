const { Queue } = require('bullmq');

const queue = new Queue('security-events', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
});

// ─── Simulated Log Generator ───────────────────────────────────────
// Generates realistic security log lines for dev/demo testing.
// In production, the chokidar watcher handles real files.

const SIMULATED_LOGS = [
  // SSH brute force attempts
  {
    source: '/var/log/auth.log',
    lines: [
      'May 23 01:14:22 prod-srv sshd[14221]: Failed password for invalid user admin from 185.220.101.42 port 52341 ssh2',
      'May 23 01:14:25 prod-srv sshd[14223]: Failed password for root from 45.33.32.156 port 38291 ssh2',
      'May 23 01:14:28 prod-srv sshd[14225]: Failed password for invalid user test from 185.220.101.42 port 52355 ssh2',
      'May 23 01:14:30 prod-srv sshd[14226]: Failed password for invalid user oracle from 92.118.160.71 port 40123 ssh2',
      'May 23 01:14:33 prod-srv sshd[14228]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=185.220.101.42',
      'May 23 01:15:01 prod-srv sshd[14230]: Failed password for invalid user postgres from 45.33.32.156 port 38301 ssh2',
    ],
  },
  // Nginx access logs — suspicious activity
  {
    source: '/var/log/nginx/access.log',
    lines: [
      '185.220.101.42 - - [23/May/2026:01:14:22 +0000] "GET /admin/config.php HTTP/1.1" 404 162 "-" "Mozilla/5.0"',
      '92.118.160.71 - - [23/May/2026:01:14:25 +0000] "POST /wp-login.php HTTP/1.1" 404 162 "-" "python-requests/2.28.0"',
      '45.33.32.156 - - [23/May/2026:01:14:28 +0000] "GET /../../etc/passwd HTTP/1.1" 400 166 "-" "Nmap/7.94"',
      '185.220.101.42 - - [23/May/2026:01:14:30 +0000] "GET /api/v1/users?id=1 UNION SELECT * FROM users-- HTTP/1.1" 400 166 "-" "sqlmap/1.7"',
      '10.0.0.55 - - [23/May/2026:01:14:33 +0000] "GET /dashboard HTTP/1.1" 200 8234 "-" "Mozilla/5.0 (Windows NT 10.0)"',
      '92.118.160.71 - - [23/May/2026:01:14:35 +0000] "GET /<script>alert(1)</script> HTTP/1.1" 400 166 "-" "Mozilla/5.0"',
    ],
  },
  // Sudo / privilege escalation
  {
    source: '/var/log/auth.log',
    lines: [
      'May 23 01:15:10 prod-srv sudo: unknown_user : user NOT in sudoers ; TTY=pts/0 ; PWD=/home/unknown_user ; USER=root ; COMMAND=/bin/bash',
      'May 23 01:15:15 prod-srv su[14250]: FAILED su for root by unknown_user',
      'May 23 01:15:20 prod-srv sudo: devops : TTY=pts/1 ; PWD=/root ; USER=root ; COMMAND=/usr/bin/apt install nmap',
      'May 23 01:15:25 prod-srv kernel: [UFW BLOCK] IN=eth0 OUT= MAC=... SRC=185.220.101.42 DST=10.0.0.5 LEN=44 TOS=0x00 TTL=64 PROTO=TCP SPT=54321 DPT=22 WINDOW=1024',
    ],
  },
  // Port scanning
  {
    source: '/var/log/syslog',
    lines: [
      'May 23 01:16:00 prod-srv kernel: [UFW BLOCK] IN=eth0 SRC=92.118.160.71 DST=10.0.0.5 PROTO=TCP DPT=3306',
      'May 23 01:16:01 prod-srv kernel: [UFW BLOCK] IN=eth0 SRC=92.118.160.71 DST=10.0.0.5 PROTO=TCP DPT=5432',
      'May 23 01:16:02 prod-srv kernel: [UFW BLOCK] IN=eth0 SRC=92.118.160.71 DST=10.0.0.5 PROTO=TCP DPT=6379',
      'May 23 01:16:03 prod-srv kernel: [UFW BLOCK] IN=eth0 SRC=92.118.160.71 DST=10.0.0.5 PROTO=TCP DPT=27017',
      'May 23 01:16:04 prod-srv kernel: [UFW BLOCK] IN=eth0 SRC=92.118.160.71 DST=10.0.0.5 PROTO=TCP DPT=8080',
    ],
  },
  // Normal / benign logs (to test info classification)
  {
    source: '/var/log/auth.log',
    lines: [
      'May 23 01:17:00 prod-srv sshd[14260]: Accepted publickey for devops from 10.0.0.100 port 42001 ssh2',
      'May 23 01:17:05 prod-srv CRON[14265]: pam_unix(cron:session): session opened for user root by (uid=0)',
      'May 23 01:17:10 prod-srv systemd-logind[524]: New session 145 of user devops.',
    ],
  },
];

let logGroupIndex = 0;
let lineIndex = 0;

function getNextSimulatedLog() {
  const group = SIMULATED_LOGS[logGroupIndex];
  const line = group.lines[lineIndex];

  // Update timestamp to current
  const now = new Date();
  const timestamp = now.toISOString();

  lineIndex++;
  if (lineIndex >= group.lines.length) {
    lineIndex = 0;
    logGroupIndex = (logGroupIndex + 1) % SIMULATED_LOGS.length;
  }

  return {
    source: group.source,
    line,
    timestamp,
  };
}

async function enqueueLog(logData) {
  try {
    const job = await queue.add('analyze-log', {
      path: logData.source,
      line: logData.line,
      timestamp: logData.timestamp,
      logEntryId: null, // simulated logs don't have a LogEntry record
    });
    console.log(`[${logData.timestamp}] Enqueued: ${logData.line.substring(0, 80)}... → Job ${job.id}`);
  } catch (err) {
    console.error('Failed to enqueue log:', err.message);
  }
}

// ─── Simulation Mode ───────────────────────────────────────────────
const SIMULATION_INTERVAL_MS = parseInt(process.env.SIM_INTERVAL_MS || '5000', 10);

console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║        Serv-I Watcher Agent                  ║');
console.log('╠══════════════════════════════════════════════╣');
console.log('║  📡 Mode: Simulated Log Generator            ║');
console.log(`║  ⏱️  Interval: ${String(SIMULATION_INTERVAL_MS).padEnd(5)}ms                       ║`);
console.log('╚══════════════════════════════════════════════╝');
console.log('');

// Emit a simulated log entry at regular intervals
setInterval(async () => {
  const log = getNextSimulatedLog();
  await enqueueLog(log);
}, SIMULATION_INTERVAL_MS);

// Also emit one immediately on start
(async () => {
  const log = getNextSimulatedLog();
  await enqueueLog(log);
})();