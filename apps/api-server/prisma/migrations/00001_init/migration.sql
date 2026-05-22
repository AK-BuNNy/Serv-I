-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable: log_entries
CREATE TABLE IF NOT EXISTS "log_entries" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: incidents
CREATE TABLE IF NOT EXISTS "incidents" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "raw_log" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ai_summary" TEXT,
    "ai_provider" TEXT,
    "confidence" DOUBLE PRECISION DEFAULT 0,
    "indicators" JSONB DEFAULT '[]',
    "report_markdown" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "embedding" vector(1536),
    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: threat_reports
CREATE TABLE IF NOT EXISTS "threat_reports" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ai_provider" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "threat_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "threat_reports" ADD CONSTRAINT "threat_reports_incident_id_fkey"
    FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "incidents_severity_idx" ON "incidents"("severity");
CREATE INDEX IF NOT EXISTS "incidents_category_idx" ON "incidents"("category");
CREATE INDEX IF NOT EXISTS "incidents_created_at_idx" ON "incidents"("created_at");

-- CreateIndex: HNSW vector index for fast similarity search
CREATE INDEX IF NOT EXISTS "incidents_embedding_idx" ON "incidents"
    USING hnsw ("embedding" vector_cosine_ops);
