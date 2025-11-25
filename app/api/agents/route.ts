import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');
    const db = getDb();

    if (email) {
      const agent = db
        .prepare('SELECT * FROM agent WHERE lower(email) = lower(?) LIMIT 1')
        .get(email);

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      return NextResponse.json(agent);
    }

    if (id) {
      const agent = db.prepare('SELECT * FROM agent WHERE id = ? LIMIT 1').get(id);
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }
      return NextResponse.json(agent);
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const totalCount = db.prepare('SELECT COUNT(*) as count FROM agent').get() as { count: number };

    const agents = db
      .prepare(
        `
      SELECT * FROM agent 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset);

    return NextResponse.json({
      data: agents,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, is_active } = body;

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO agent (first_name, last_name, email, is_active)
      VALUES (?, ?, ?, ?)
    `).run(first_name, last_name, email, is_active ? 1 : 0);

    return NextResponse.json({ id: result.lastInsertRowid, ...body });
  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create agent' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, first_name, last_name, email, is_active } = body;

    const db = getDb();
    db.prepare(`
      UPDATE agent 
      SET first_name = ?, last_name = ?, email = ?, is_active = ?
      WHERE id = ?
    `).run(first_name, last_name, email, is_active ? 1 : 0, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update agent' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM agent WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete agent' },
      { status: 500 }
    );
  }
}

