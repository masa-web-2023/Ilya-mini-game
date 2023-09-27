export interface Point {
  x: number,
  y: number
}

export interface Enemy {
  speed: number,
  body: number[][],
  position: Point
}
