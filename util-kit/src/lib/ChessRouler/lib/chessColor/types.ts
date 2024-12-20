export type WhiteShortColor = 'w';
export type BlackShortColor = 'b';

// @deprecate
export type WhiteLongColor = 'white';
export type BlackLongColor = 'black';

export type WhiteColor = WhiteShortColor;
// export type WhiteColor = WhiteShortColor | WhiteLongColor;
export type BlackColor = BlackShortColor;
// export type BlackColor = BlackShortColor | BlackLongColor;

// @deprecate
// export type LongChessColor = WhiteShortColor | BlackShortColor;
export type LongChessColor = WhiteLongColor | BlackLongColor;
export type ShortChessColor = WhiteShortColor | BlackShortColor;
export type ChessColor = WhiteColor | BlackColor;
