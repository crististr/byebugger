![alt text](https://raw.githubusercontent.com/jnapolitan/byebugger/master/frontend/public/assets/images/splashText.png)

Single-player 3D shooter

- [Live Site](http://byebugger.herokuapp.com/#/)
- [Background and Overview](#background-and-overview)
- [Technologies](#technologies)
- [Functionality and MVP](#functionality-and-mvp)
- [Accomplished Over the Weekend](#accomplished-over-the-weekend)
- [Group Members and Work Breakdown](#group-members-and-work-breakdown)

<!-- * [Additional Planned Features](#additional-planned-features)
* [Credits](#credits)
* [Group Members](#group-members) -->

## Background and Overview

(Updated 1/9/2019) ByeBugger is a single-player retro-style first-person shooter. Every game session is unique as the map is procedurally generated using binary space partitioning. The algorithm yields a 2D array of 1s and 0s, where 1s represent walls and 0s represent empty spaces. The 2D array is then passed to a rendering function, which uses Three.JS to convert the two-dimensional map to a three-dimensional world. Custom controls, bullet physics, and collision-detection were implemented to simulate a traditional FPS view.

<!-- We will need to:
- store user and info (time of when they played, their score) in database
-  -->

## Functionality and MVP

- [ ] Game lobby with player sign up/login (User Auth)
- [ ] Library of questions/bugs
- [ ] Library of primer/learning pages (precedes game start, to prime user on some concepts they may encounter throughout the game)
- [ ] Graphic assets
  - [ ] Bugs
  - [ ] Human player
  - [ ] Textures/environment
  - [ ] Life-line objects
- [ ] Player control logic
- [ ] Bug behavior logic
- [ ] Game logic
  - [ ] Point system
  - [ ] Collision
  - [ ] Controls / user input
- [ ] Production README

#### Bonus Features

- [ ] Level difficulty logic
  - [ ] Introduce obstacle logic
    - [ ] Product manager logic
  - [ ] Second floor to map
  - [ ] Bugs avoid player
  - [ ] Final level:
    - [ ] Beat Heroku boss
    - [ ] Player looks for master key to defeat boss
- [ ] User profile pages
- [ ] User generated questions

## Technologies

ByeBugger is implemented using the MERN stack (MongoDB, Express, React, and Node.js) to keep track of players and a leaderboard of scores, as well as abstract game elements into React components. The game is rendered using HTML5 Canvas and WebGL/three.js and real-time updates are tracked via redux global state.

#### Backend: MongoDB/Express

User Model: handle, email, password
Stats Model: user id, user handle, score

#### Frontend: React/Node.js

## Accomplished over the Weekend

- Set up database
- Proposal README
- Implement user authorization on database backend
- Initial environment rendering and user controls
- Initial bug logic

## Group Members & Work Breakdown

* [Julian Napolitan](https://github.com/jnapolitan)
    * Bug / enemy AI behavior and logic
* [Sue Park](https://github.com/spark1031)
    * Bug capture / solve components and logic
* [Eric To](https://github.com/eric-to)
    * Procedural environment generation, object collision, controls
    
## Weekly Project Plan

### Day 1

- Refactor/integrate current bug AI into most recent environment - **Julian**
- Refactor FPS controls for collision and evolve environment aesthetic - **Eric**
- Initial approach to bug capture/solve logic - **Sue**

### Day 2

- Continue evolving / implementing bug AI with additional randomized / unique behavior - **Julian**
- Refactor dungeon generation algorithm to implement binary space partioning for Roguelike-experience - **Eric**
- Implement initial bug capture/solve logic into most recent environment - **Sue**

### Day 3

- v1 bug AI and testing complete and implemented - **Julian**
- v1 dynamic dungeon environment generation complete and implemented - **Eric***
- v1 bug capture/solve logic and testing complete and implemented - **Sue**

### Day 4

- Polish bug AI assets and optimize game playing experience (speed, regeneration) - **Julian**
- Polish dynamic dungeon environment generation / finalize supporting elements (lighting, sounds, textures) - **Eric**
- Polish bug capture/solve logic and research solutions for housing questions in DB - **Sue**

### Day 5

- Start work on bonus feature: Bugs deliberately avoid player - **Julian**
- Start work on bonus feature: A* pathing (heuristic: Manhattan distance) for AI, multiple floors & teleport - **Eric**
- Start work on bous feature: User generated questions - **Sue**

### Day 6

- Complete Production README.md - **All team members**
- Implement completed bonus features - **All team members**
- Finalize assets and aesthetic - **All team members**
- Finish testing and debugging - **All team members**

## Credits
* [Kirokaze for intro screen background](https://www.deviantart.com/kirokaze/)
* [ThreeJS](https://github.com/mrdoob/three.js/)
