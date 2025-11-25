import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    const db = getDb();

    if (agentId) {
      const campaigns = db
        .prepare(
          `
        SELECT c.*
        FROM campaign c
        INNER JOIN campaign_agent ca ON ca.campaign_id = c.id
        WHERE ca.agent_id = ?
        ORDER BY c.created_at DESC
      `
        )
        .all(agentId);

      return NextResponse.json(campaigns);
    }

    const campaigns = db.prepare('SELECT * FROM campaign ORDER BY created_at DESC').all();
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, is_active } = body;

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO campaign (name, description, is_active)
      VALUES (?, ?, ?)
    `).run(name, description || '', is_active ? 1 : 0);

    return NextResponse.json({ id: result.lastInsertRowid, ...body });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

