import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const agentId = searchParams.get('agentId');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    const db = getDb();
    let query = '';
    let params: any[] = [];

    if (groupBy === 'day') {
      query = `
        SELECT 
          DATE(work_date) as period,
          SUM(hours_worked) as total_hours,
          COUNT(*) as work_days
        FROM campaign_kpi
        WHERE 1=1
      `;
      if (campaignId) {
        query += ' AND campaign_id = ?';
        params.push(campaignId);
      }
      if (agentId) {
        query += ' AND agent_id = ?';
        params.push(agentId);
      }
      query += ' GROUP BY DATE(work_date) ORDER BY period DESC LIMIT 30';
    } else if (groupBy === 'week') {
      query = `
        SELECT 
          strftime('%Y-W%W', work_date) as period,
          SUM(hours_worked) as total_hours,
          COUNT(DISTINCT DATE(work_date)) as work_days
        FROM campaign_kpi
        WHERE 1=1
      `;
      if (campaignId) {
        query += ' AND campaign_id = ?';
        params.push(campaignId);
      }
      if (agentId) {
        query += ' AND agent_id = ?';
        params.push(agentId);
      }
      query += ` GROUP BY strftime('%Y-W%W', work_date) ORDER BY period DESC LIMIT 12`;
    } else if (groupBy === 'month') {
      query = `
        SELECT 
          strftime('%Y-%m', work_date) as period,
          SUM(hours_worked) as total_hours,
          COUNT(DISTINCT DATE(work_date)) as work_days
        FROM campaign_kpi
        WHERE 1=1
      `;
      if (campaignId) {
        query += ' AND campaign_id = ?';
        params.push(campaignId);
      }
      if (agentId) {
        query += ' AND agent_id = ?';
        params.push(agentId);
      }
      query += ` GROUP BY strftime('%Y-%m', work_date) ORDER BY period DESC LIMIT 12`;
    }

    const stmt = db.prepare(query);
    const kpis = params.length > 0 ? stmt.all(...params) : stmt.all();

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, agentId, hoursWorked, workDate } = body;

    if (!campaignId || !agentId || !hoursWorked || !workDate) {
      return NextResponse.json(
        { error: 'campaignId, agentId, hoursWorked, and workDate are required.' },
        { status: 400 }
      );
    }

    const numericHours = Number(hoursWorked);
    if (Number.isNaN(numericHours) || numericHours <= 0) {
      return NextResponse.json({ error: 'hoursWorked must be a positive number.' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(
      `
        INSERT INTO campaign_kpi (campaign_id, agent_id, hours_worked, work_date)
        VALUES (?, ?, ?, ?)
      `
    ).run(campaignId, agentId, numericHours, workDate);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error logging KPIs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log hours' },
      { status: 500 }
    );
  }
}

