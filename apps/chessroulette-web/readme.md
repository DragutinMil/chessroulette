# Chessroulette

## Features

## Matches

A Match between titans. Two players meet to play a chess match.

The Match has the following params:

- Type `"bestOf" | "openEnded"`
- Time Class
- Players: The players are known from the beginning (via a matchmaking logic -atm only manual)

#### Create a match

There are 2 ways to create a match:

- [ ] [WIP] Via the Api

**Url:** GET `/api/room/schedule`

**Query Params Schema:**

```ts
export const matchActivityParamsSchema = z.object({
  activity: z.literal('match'),

  // TODO: Type these better
  type: z.union([
    z.literal('bestOf'), // BestOf = best out of N Rounds (e.g. 2 out of 3, 3 out of 5, etc...)
    z.literal('openEnded'), // This has no predefined rounds
  ]),
  // Rounds is only needed when "type" = "bestOf" and is an Odd Positive Number
  rounds: z.coerce.number().optional(),

  timeClass: gameTimeClassRecord.optional(),

  // Players
  challengerId: z.string(),
  challengeeId: z.string(),

  // This is the color of the challenger
  // If no color specified it's assigned randomly
  startColor: chessColorSchema.optional(),
});
```

**Response Schema**:

```ts
{
  links: [
    {
      userRole: 'challenger';
      url: string; // The Url to access the Match Room
      matchId: string;
    }, {
      userRole: 'challengee';
      url: string; // The Url to access the Match Room (different than the challenger's link)
      matchId: string;
    }
  ]
}
```

**Example Call:** `/api/room/schedule?client=op&activity=match&type=bestOf&rounds=3&challengerId=player1&challengeeId=player2&startColor=white&timeClass=blitz`

**Example Response:**

```json
{
  "links": [
    {
      "userRole": "challenger",
      "url": "http://localhost:4200/room/new/opX7Tlqpj?activity=match&type=bestOf&rounds=3&timeClass=blitz&challengerId=player1&challengeeId=player2&startColor=white&challenger=1",
      "matchId": "opX7Tlqpj"
    },
    {
      "userRole": "challengee",
      "url": "http://localhost:4200/room/new/opX7Tlqpj?activity=match&type=bestOf&rounds=3&timeClass=blitz&challengerId=player1&challengeeId=player2&startColor=white&flipped=1",
      "matchId": "opX7Tlqpj"
    }
  ]
}
```

- [ ] [TBD] Via the Match Making (In the future)

#### Join a Match (open a Match Room)

Copy one of the links from above, depending on the user role.

**_Note_**, you need to append the `userId` & `userDisplayName` Search Params to the link in order to match the player with the respective user, otherwise anybody else with a different userId will only be able to spectate.
_**This is the case only for MVP, until we have proper Authentication Integration (with external clients such as Outpost).**_

#### Check Match Status

- [ ] [WIP] Api Call

**Url**: [GET] `/api/match/{matchId}`

**Response**:

```ts
// MatchState Type
(
  | {
      type: 'bestOf';
      rounds: number; // Ensure these can only be odd numbers
    }
  | {
      type: 'openEnded';
      rounds?: undefined; // There is no end so no need for rounds here
      // rounds?: 'unlimited';
    }
) & {
  status: 'pending' | 'ongoing' | 'complete';
  players: {
    white: Player;
    black: Player;
  };
  completedPlays: PlayStore.PlayState[];
  ongoingPlay: PlayStore.PlayState;
};
```

#### Left To Do

- [x] Api route to schedule the Match
- [x] Api route to check the status of the Match
- [ ] [WIP] The Match Reducer updates correctly
  - [ ] Reacts correctly to Play Actions and changes the Match State accordingly
  - [ ] [WIP] Use tests to ensure this is working correctly
- [x] Bug: On Resign white always wins
- [ ] Check that the user currently inside the room is part of the `players`. If not cannot play.
- [x] Populate User Display Name if present (in the url)
- [x] Show the Result next to the Player Name (as an extra string to the PlayerBox component that gets populated from outside with whatever)
  - [ ] To begin with just the score such as "White (0)" "Black (0)"...later on... "White (2)" "Black (1)"...once the match finished "White (3) Winner 🏆", "Black (1)" or smtg like this
- [ ] Match Reducer
  - [ ] A Match moves to ongoing when the 1st game starts
  - [ ] A Match completes when the minimum amount of games have been finished and we have a winner (e.g. in a 2 out of 3 scenario minimum 2 games need to be player max 3)
  - [ ] Ensure the Match Status updates correctly when the `ongoingGame` status changes
- [ ] Match Dialogues:
  - [x] on match completed
    - [ ] Show the Winner Color, User Display Name if available, and a nice Victory UI. Maybe an animation or smtg
  - [x] on game completed but not match completed (in case the match is a multiple game e.g. 2 out of 3), with a timer saying the next game will start in x seconds.
    - [ ] In the future, this can be triggered or canceled manualy as well b/c maybe they want to take a break but not of concern now
  - [ ] Ensure no other situation is left out, as the UX needs to take in account all critical use cases
- [x] Don't show the "Waiting for Player" dialog if the game is `ongoing` but one of the players left the room.
- [ ] Invitation Link for spectators - (i.e. without the appended userId in the JOIN URL (see above))
- [ ] Timers are unsynched between players. It seems each time a player comes back to the room (refreshes the page for e.g.) the timer gets reset or at least goes back a few seconds
- [ ] 500 Error on Server Rendered Component of the Match Room Page
- [x] When there is a DRAW, we treated as not counting

- [ ] [WIP] UI/UX + Design
- [ ] Cleanup Code

## Classroom

A Student can meet an instructor over here and learn taking advanatge of the following features:

- [x] Camera
- [x] Free Board for Instructor (can move anywhere she likes, including invalid Chess Moves)
- [x] Restricted Board for Student
- [ ] [WIP] Persisted Lessons for the Onboarded Instructors
- [ ] Remove the Library Lessons Link from Side Menu for non Classroom pages

## Meetup

The Meetup is a casual meeting between 2 or more people with a board in the middle. For now the baord is in Freeplay mode but later on it could change.

## General LEFT TO Do for June Deploy

- [ ] Take out Oboarding Header Menu for now
