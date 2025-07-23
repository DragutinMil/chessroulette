import type { ChapterState } from '../../movex/types';

export async function SendQuestion(
  prompt: string,
  currentChapterState: ChapterState,
  stockfishMovesInfo: any
) {
  const model = 'gpt-4.1';
  const system = `Create a JSON response containing structured interactive lessons to teach chess across all levels, from beginner to advanced, by playing a chess game. Base your lessons on standard chess educational practices,
           ensuring each level gradually builds on the previous one.
# Steps
    - All positions (FEN) must be legal and reachable through normal chess play.
    - Avoid positions with impossible material or illegal move history.
    - All puzzles must have a unique, forced solution in the specified number of moves.
    - When possible, base the position on real compositions or endgame studies.
   - Avoid using artificial or impossible setups.
   - Understanding check, checkmate, and stalemate.
   - Basic opening strategies and the importance of controlling the center.
   - Deep dive into common opening tactics and variations.
   - Introduction to key middle-game strategies and tactics.
   - Understanding pawn structure, forks, pins, and discovered attacks.
   - Analyzing classic games to understand strategy.
   - Mastering complex opening strategies and defenses.
   - Advanced middle-game tactical and strategic topics.
   - Study of endgame principles, including various mating techniques.
   - Analyzing grandmaster games for advanced strategic insights.

All your responses must be only in vaild JSON format specified below:
{
  "fen":  "[Forsyth-Edwards Notation]",
  "move": "[chess move]",
  "text": "[Human readable text, move explanation]"
}
# Good Example:
{
    "fen": "8/4k3/1p2p1p1/1nnpK1P1/5PB1/8/8/3R4 w - - 0 51",
    "move": "Rd1-h1",
    "text": "White plays Rh1, preparing to invade the h-file and pressure the black king. In this endgame, White uses both the rook and bishops to control key squares and restrict Black's king movement. The lesson here is to coordinate your rook and bishop(s) in the endgame, aiming to create threats or win material. Try to find the best continuation for Black, and consider how White keeps improving."
  }

# Notes
- All fields in the response are optional.
- Include practical examples, exercises, and/or puzzles to aid the learning process.
- Adjust content complexity based on the learner's level, gradually progressing in difficulty.
- Consider including additional resources or references for learners who wish to explore each topic further.`;

  //       You are a helpful chess expert. Respond only in raw JSON format with **exactly one field** called "text".

  //       # Instructions:
  //       - Answer chess questions naturally, like a human would (never say you're an AI).
  //       - Explain the position and opening, and share your opinion in plain human language.
  //       - Responses must be short and direct.
  //       - Do not include any fields other than "text".
  //       - Do not wrap the JSON in triple backticks or add formatting (no \`\`\`json, etc).
  //       - Assume every question includes a FEN string — always use it.
  //       - For non-chess questions: reply briefly or say "if you're 100% into chess, you don't bother with such questions".
  //       - Example output:
  //         {
  //           "text": "Black has a strong center with pawns on d5 and e6. This is the French Defense, where white will usually try to attack the base of the pawn chain."
  //         }
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      .idResponse;
  const question = prompt + '. Fen:' + currentChapterState.displayFen;
  console.log('question in send question', question);
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB +
        `ai_prompt_v2r?prompt=${question}&previous_response_id=${previusMessageId}&model=${model}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
