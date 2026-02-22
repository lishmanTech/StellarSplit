import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGovernanceTables1769800000000
  implements MigrationInterface
{
  name = 'CreateGovernanceTables1769800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create governance_config table
    await queryRunner.query(`
      CREATE TABLE "governance_config" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "quorumPercentage" integer NOT NULL DEFAULT 51,
        "votingPeriod" integer NOT NULL DEFAULT 259200,
        "timelockDelay" integer NOT NULL DEFAULT 172800,
        "proposalLifetime" integer NOT NULL DEFAULT 604800,
        "proposalThreshold" bigint NOT NULL DEFAULT '1000000000000',
        "vetoAddresses" text[] NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create proposals table
    await queryRunner.query(`
      CREATE TYPE "proposal_status_enum" AS ENUM (
        'pending', 'active', 'succeeded', 'defeated', 
        'queued', 'executed', 'vetoed', 'expired'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "proposals" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "proposer" varchar NOT NULL,
        "description" text NOT NULL,
        "status" "proposal_status_enum" NOT NULL DEFAULT 'pending',
        "votesFor" bigint NOT NULL DEFAULT '0',
        "votesAgainst" bigint NOT NULL DEFAULT '0',
        "votesAbstain" bigint NOT NULL DEFAULT '0',
        "votingStartTime" TIMESTAMP,
        "votingEndTime" TIMESTAMP,
        "executionTime" TIMESTAMP,
        "executedAt" TIMESTAMP,
        "vetoedBy" varchar,
        "vetoReason" text,
        "quorumPercentage" integer NOT NULL DEFAULT 51,
        "totalVotingPower" bigint NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_proposals_status" ON "proposals" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_proposals_proposer" ON "proposals" ("proposer")
    `);

    // Create votes table
    await queryRunner.query(`
      CREATE TYPE "vote_type_enum" AS ENUM ('for', 'against', 'abstain')
    `);

    await queryRunner.query(`
      CREATE TABLE "votes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "proposalId" uuid NOT NULL,
        "voter" varchar NOT NULL,
        "voteType" "vote_type_enum" NOT NULL,
        "votingPower" bigint NOT NULL,
        "reason" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_votes_proposal" FOREIGN KEY ("proposalId") 
          REFERENCES "proposals"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_votes_proposal_voter" 
      ON "votes" ("proposalId", "voter")
    `);

    // Create proposal_actions table
    await queryRunner.query(`
      CREATE TYPE "action_type_enum" AS ENUM (
        'transfer_funds', 'update_parameter', 'add_member', 
        'remove_member', 'upgrade_contract', 'custom'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "proposal_actions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "proposalId" uuid NOT NULL,
        "actionType" "action_type_enum" NOT NULL,
        "target" varchar NOT NULL,
        "parameters" jsonb NOT NULL,
        "calldata" text,
        "executed" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_proposal_actions_proposal" FOREIGN KEY ("proposalId") 
          REFERENCES "proposals"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_proposal_actions_proposal" 
      ON "proposal_actions" ("proposalId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "proposal_actions"`);
    await queryRunner.query(`DROP TYPE "action_type_enum"`);
    await queryRunner.query(`DROP TABLE "votes"`);
    await queryRunner.query(`DROP TYPE "vote_type_enum"`);
    await queryRunner.query(`DROP TABLE "proposals"`);
    await queryRunner.query(`DROP TYPE "proposal_status_enum"`);
    await queryRunner.query(`DROP TABLE "governance_config"`);
  }
}
