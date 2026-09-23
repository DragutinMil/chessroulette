import Cookies from 'js-cookie';

export type MessageMoveSegment =
  | { type: 'text'; value: string; start: number; end: number }
  | {
      type: 'move';
      value: string;
      start: number;
      end: number;
      moveNumber: number;
      colorIdx: 0 | 1;
    };

function looksLikeSanMove(word: string): boolean {
  if (!word || word.length > 10) return false;
  if (/^\d+\./.test(word)) return false;
  if (/^\[/.test(word)) return false;
  return /^(O-O-O|O-O|[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](=[NBRQ])?[+#]?)$/.test(
    word.trim()
  );
}

/**
 * Deli tekst poruke na obican tekst i potezne segmente, da bi potezi u chatu
 * mogli da budu klikabilni i da skacu na poziciju u notaciji.
 */
export function parseMessageMoves(content: string): MessageMoveSegment[] {
  const moveRegex = /(\d+\.(?:\.\.)?\s*[^\s\[\]]+)/g;
  const moveSegments: Array<{
    start: number;
    end: number;
    moveNumber: number;
    colorIdx: 0 | 1;
    value: string;
  }> = [];
  let match: RegExpExecArray | null;
  while ((match = moveRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const numMatch = fullMatch.match(/^(\d+)\.(\.\.)?\s*(.*)$/);
    const moveNumber = numMatch ? parseInt(numMatch[1], 10) : 1;
    const isBlack = !!numMatch?.[2];
    moveSegments.push({
      start: match.index,
      end: match.index + fullMatch.length,
      moveNumber,
      colorIdx: (isBlack ? 1 : 0) as 0 | 1,
      value: fullMatch,
    });
    if (!isBlack) {
      const after = content.slice(match.index + fullMatch.length);
      const inlineBlack = after.match(/^\s+([^\s\[\]]+)/);
      if (inlineBlack && looksLikeSanMove(inlineBlack[1])) {
        const blackValue = inlineBlack[1];
        const blackStart = match.index + fullMatch.length;
        const blackEnd = blackStart + inlineBlack[0].length;
        moveSegments.push({
          start: blackStart,
          end: blackEnd,
          moveNumber,
          colorIdx: 1,
          value: blackValue,
        });
        moveRegex.lastIndex = blackEnd;
      }
    }
  }
  moveSegments.sort((a, b) => a.start - b.start);
  const segments: MessageMoveSegment[] = [];
  let lastEnd = 0;
  for (const seg of moveSegments) {
    if (seg.start > lastEnd) {
      segments.push({
        type: 'text',
        value: content.slice(lastEnd, seg.start),
        start: lastEnd,
        end: seg.start,
      });
    }
    segments.push({
      type: 'move',
      value: seg.value,
      start: seg.start,
      end: seg.end,
      moveNumber: seg.moveNumber,
      colorIdx: seg.colorIdx,
    });
    lastEnd = seg.end;
  }
  if (lastEnd < content.length) {
    segments.push({
      type: 'text',
      value: content.slice(lastEnd),
      start: lastEnd,
      end: content.length,
    });
  }
  return segments;
}

export async function ai_prompt(
  question: string,
  previusMessageId: string,
  model: string
) {
  const token = Cookies.get('sessionToken');
  const body: Record<string, string> = {
    prompt: question,
    model: model,
    agent_name: 'Lesson',
  };
  if (previusMessageId?.trim()) body.previous_response_id = previusMessageId;
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + `ai_prompt_agent_v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return data?.message || `Error: ${response.status}`;
    }
    return data;
  } catch (error) {
    console.error('Fetch error', error);
  }
}

export async function getSubscribeInfo() {
  const token = Cookies.get('sessionToken');

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + 'current_user_subscription',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}

let movexUpdateQueue = Promise.resolve();

/**
 * Movex dispatch nije concurrent-safe - dva dispatcha u istom ticku pucaju sa
 * "PromiseDelegate is already settled". Zato ih redjamo i ostavljamo razmak
 * da server round-trip i syncState stignu da se zavrse.
 */
export function enqueueMovexUpdate<T>(
  updateFn: () => Promise<T> | void
): Promise<void> {
  movexUpdateQueue = movexUpdateQueue
    .then(async () => {
      await updateFn();
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
    })
    .catch((err) => console.error('Error in Movex update:', err));

  return movexUpdateQueue;
}
