/** Path of Legends leagues as the live API numbers them (1–7); 7 is Ultimate Champion. */
export const POL_LEAGUES = ['Master I', 'Master II', 'Master III', 'Champion', 'Grand Champion', 'Royal Champion', 'Ultimate Champion'];
export const leagueName = (n: number | null | undefined) => (n ? (POL_LEAGUES[n - 1] ?? `League ${n}`) : 'No league');
