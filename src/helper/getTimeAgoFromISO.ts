export function getTimeAgoFromISO(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const secondsAgo = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutesAgo = Math.round(secondsAgo / 60);
    const hoursAgo = Math.round(minutesAgo / 60);
    const daysAgo = Math.round(hoursAgo / 24);

    if (secondsAgo < 60) {
        return "Just now";
    }
    if (minutesAgo < 60) {
        return `${minutesAgo} minutes ago`;
    }
    if (hoursAgo < 24) {
        return `${hoursAgo} hours ago`;
    }
    if (daysAgo === 1) {
        return "yesterday";
    }
    if (daysAgo < 7) {
        return `${daysAgo} days ago`;
    }
    if (daysAgo === 7) {
        return "1 week ago";
    } 
    
    // for dates more than 7 days ago, give a precise date
    const fullFormatter = new Intl.DateTimeFormat("en-US", {
         year: "numeric",
         month: "long",
         day: "numeric",
    });
   
    return fullFormatter.format(date);
}
