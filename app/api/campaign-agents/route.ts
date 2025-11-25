import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const campaignId = searchParams.get('campaignId');

    const db = getDb();
    let query = `
      SELECT 
        ca.*,
        a.first_name || ' ' || a.last_name as agent_name,
        c.name as campaign_name
      FROM campaign_agent ca
      JOIN agent a ON ca.agent_id = a.id
      JOIN campaign c ON ca.campaign_id = c.id
    `;
    const params: any[] = [];

    if (agentId) {
      query += ' WHERE ca.agent_id = ?';
      params.push(agentId);
    } else if (campaignId) {
      query += ' WHERE ca.campaign_id = ?';
      params.push(campaignId);
    }

    query += ' ORDER BY ca.created_at DESC';

    const stmt = db.prepare(query);
    const assignments = params.length > 0 ? stmt.all(...params) : stmt.all();

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching campaign agents:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, campaign_id } = body;

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO campaign_agent (agent_id, campaign_id)
      VALUES (?, ?)
    `).run(agent_id, campaign_id);

    return NextResponse.json({ id: result.lastInsertRowid, ...body });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM campaign_agent WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}

