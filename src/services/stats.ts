import { Link, ClickRecord, Stats } from '../types';

class StatsService {
  calculateStats(links: Link[], clickRecords: ClickRecord[]): Stats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalClicks = clickRecords.length;
    
    const clicksToday = clickRecords.filter(click => 
      new Date(click.clickedAt) >= today
    ).length;

    const clicksThisWeek = clickRecords.filter(click => 
      new Date(click.clickedAt) >= thisWeek
    ).length;

    const clicksThisMonth = clickRecords.filter(click => 
      new Date(click.clickedAt) >= thisMonth
    ).length;

    // أكثر الروابط استخداماً
    const topLinks = links
      .map(link => ({ link, clicks: link.clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // النقرات حسب اليوم (آخر 30 يوم)
    const clicksByDay: Array<{ date: string; clicks: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const clicks = clickRecords.filter(click => {
        const clickDate = new Date(click.clickedAt);
        return clickDate >= dayStart && clickDate < dayEnd;
      }).length;

      clicksByDay.push({ date: dateStr, clicks });
    }

    return {
      totalClicks,
      clicksToday,
      clicksThisWeek,
      clicksThisMonth,
      topLinks,
      clicksByDay
    };
  }
}

export const statsService = new StatsService();