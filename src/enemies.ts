import { Enemy, Point } from "./types";

abstract class AbstractEnemy implements Enemy {
  speed:number = 4;
  body:number[][] = [[]];
  position = {x:0, y:0}
  constructor(position: Point){
    this.position = position
  }
}

class Goon extends AbstractEnemy{
  speed = 4;
  body = [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1]
  ];
  static width = 5;
}

class Brute extends AbstractEnemy{
  speed = 2;
  body = [
    [1, 3, 2 , 3, 1],
    [2, 0, 0, 0, 2],
    [2, 0, 0, 2, 0],
    [2, 0, 0, 0, 2],
    [1, 3, 2, 3, 1]
  ];
  static width = 5;
}

class Speedster extends AbstractEnemy{
  speed = 6;
  body = [
    [2, 0, 1, 0, 1],
    [0, 1, 0, 1, 0],
    [2, 0, 1, 0, 1],
  ];
  static width = 3;
}

class Warlock extends AbstractEnemy{
  speed = 1;
  body = [
    [4, 3, 2, 2, 2],
    [0, 2, 3, 0, 0],
    [0, 3, 0, 4, 4],
    [0, 2, 3, 0, 0],
    [4, 3, 2, 2, 2]
  ];
  static width = 5;
}

export const enemyClasses = [
  Goon,
  Brute,
  Speedster,
  Warlock
]
