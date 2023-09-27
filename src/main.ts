import { enemyClasses } from "./enemies"
import { Enemy, Point } from "./types"

const gameCanvas = document.getElementById("gamecanvas") as HTMLCanvasElement
if (!gameCanvas) throw "no gameScreen"
const ctx = gameCanvas.getContext("2d")
if (!ctx) throw "no context"

const gameStart = document.getElementById("startgame")
if (!gameStart) throw "no startGame"
const gameOver = document.getElementById("gameover")
if (!gameOver) throw "no gameOver"

const currentHPElement = document.getElementById("current-hitpoints")
if (!currentHPElement) throw "no currentHPElement"
const maxHPElement = document.getElementById("max-hitpoints")
if (!maxHPElement) throw "no maxHPElement"
const maxHP = Number(maxHPElement.innerText)
const scoreElement = document.getElementById("score")
if (!scoreElement) throw "no scoreElement"

const finalScoreElement = document.getElementById("finalscore")
if (!finalScoreElement) throw "no finalscoreElement"
const againElement = document.getElementById("again")
if (!againElement) throw "no againElement"

const getScore = () => Number(scoreElement.innerText)
const setScore = (f: (s: number) => number) => scoreElement.innerText = f(getScore()).toString()

const getCurrentHP = () => Number(currentHPElement.innerText)
const setCurrentHP = (f: (s: number) => number) => currentHPElement.innerText = (f(getCurrentHP())).toString()


const SCALE = 4;
const CLIENT_HEIGHT = 500;
const CLIENT_WIDTH = 500;
const HEIGHT = CLIENT_HEIGHT / SCALE
const WIDTH = CLIENT_WIDTH / SCALE

gameCanvas.width = CLIENT_WIDTH
gameCanvas.height = CLIENT_HEIGHT;

const DRAWING_COLOR = "lightblue"
const CLEAR_COLOR = "white"
const ENEMY_COLORS = [
  "red",
  "orange",
  "blue",
  "purple",
  "black"
]
const SPAWN_FREQUENCY_COEFFICIENT = 0.01;

const getCleanDrawingMatrix = () =>
  Array
    .from({ length: WIDTH })
    .map(() => Array(HEIGHT).fill(false))

const renderDrawing = (drawingMatrix: boolean[][]) => {
  ctx.fillStyle = DRAWING_COLOR
  drawingMatrix.forEach(
    (column, i) =>
      column.forEach((pixel, j) => {
        if (pixel) {
          ctx.fillRect(i * SCALE, j * SCALE, SCALE, SCALE)
        }
      })
  )
}

const clearCanvas = () => {
  ctx.fillStyle = CLEAR_COLOR
  ctx.fillRect(0, 0, CLIENT_WIDTH, CLIENT_HEIGHT)
}

const drawLine = (drawingMatrix: boolean[][], start: Point, end: Point) => {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);

  const sx = start.x < end.x ? 1 : -1;
  const sy = start.y < end.y ? 1 : -1;

  let err = dx - dy

  while (true) {
    if (drawingMatrix[start.x]?.[start.y] !== undefined)
      drawingMatrix[start.x][start.y] = true

    if (start.x === end.x && start.y === end.y) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy
      start.x += sx;
    }
    if (e2 < dx) {
      err += dx;
      start.y += sy
    }
  }
}

const renderEnemy = (enemy: Enemy) => {
  enemy.body.forEach(
    (column, i) => column.forEach((pixel, j) => {
      if (pixel === 0) return;
      ctx.fillStyle = ENEMY_COLORS[pixel - 1];
      ctx.fillRect((i + enemy.position.x) * SCALE, (j + enemy.position.y) * SCALE, SCALE, SCALE)
    })
  )
}

const handleMouseDown = (e: MouseEvent, drawingMatrix: boolean[][]) => {
  drawingMatrix[Math.floor(e.offsetX / SCALE)][Math.floor(e.offsetY / SCALE)] = true
  renderDrawing(drawingMatrix)

  const handleMouseMove = (e: MouseEvent) => {
    drawLine(
      drawingMatrix,
      {
        x: Math.floor((e.offsetX - e.movementX) / SCALE),
        y: Math.floor((e.offsetY - e.movementY) / SCALE)
      },
      {
        x: Math.floor(e.offsetX / SCALE),
        y: Math.floor(e.offsetY / SCALE)
      }
    )
    renderDrawing(drawingMatrix)
  }

  gameCanvas.addEventListener(
    "mousemove",
    handleMouseMove
  )
  gameCanvas.addEventListener(
    'mouseup',
    () => gameCanvas.removeEventListener("mousemove", handleMouseMove),
    { once: true }
  )
}

const moveEnemies = (enemyList: Enemy[], drawingMatrix: boolean[][]) => {
  let damage = 0;
  enemyList.forEach((enemy) => {
    for (let k = 0; k <= enemy.speed; k++) {
      enemy.body.forEach(
        (column, i) => column.forEach((pixel, j) => {

          if (pixel === 0) return;

          if (j + enemy.position.y + k >= HEIGHT) {
            damage += enemy.body[i][j]
            enemy.body[i][j] = 0
            return;
          }

          if (!drawingMatrix[i + enemy.position.x][j + enemy.position.y + k]) return;

          drawingMatrix[i + enemy.position.x][j + enemy.position.y + k] = false;
          enemy.body[i][j] = pixel - 1
          setScore(s => s + 1)
        })
      )
    }
    enemy.position.y += enemy.speed;
  })

  setCurrentHP((hp) => hp - damage > 0 ? hp - damage : 0)

  let i = 0;
  while (i < enemyList.length) {
    if (
      !enemyList[i]
        .body
        .some(
          column => column.some(
            pixel => pixel > 0
          )
        )
    ) {
      enemyList.splice(i, 1);
      continue;
    }
    i++
  }
}

const spawnAtStart = (enemyList: Enemy[], enemyClass: { new(position: Point): Enemy }, x: number) => {
  enemyList.push(new enemyClass({ x: x, y: 0 }));
}

const getNewSpawn = (difficulty: number) => {
  // reverse hyperbola, approaches 1, bigger FREQUENCY_COEFFICIENT means more spawns
  const spawnThreshold = 1 - (1 / (difficulty * SPAWN_FREQUENCY_COEFFICIENT + 1))
  if (Math.random() > spawnThreshold) return null; //no spawns 

  //make more fair
  const enemyIndex = Math.floor(Math.random() * enemyClasses.length)

  return enemyClasses[enemyIndex]
}

const spawnNewEnemie = (difficulty: number, enemyList: Enemy[]) => {
  const newSpawn = getNewSpawn(difficulty)
  if (!newSpawn) return;

  spawnAtStart(enemyList, newSpawn, Math.floor(Math.random() * (WIDTH - newSpawn.width)))
}

const startGame = async () => {
  gameOver.style.display = "none"
  gameStart.style.display = "none"
  gameCanvas.style.display = "block"

  setScore(() => 0);
  setCurrentHP(() => maxHP);

  const cleanUp = [] as (() => void)[]
  const drawingMatrix = getCleanDrawingMatrix()
  const enemyList = [] as Enemy[]
  const onMouseDown = (e: MouseEvent) => handleMouseDown(e, drawingMatrix)
  gameCanvas.addEventListener(
    "mousedown",
    onMouseDown
  )
  cleanUp.push(() => gameCanvas.removeEventListener(
    "mousedown",
    onMouseDown
  ))

  let difficulty = 0;

  const finalScore = await new Promise<number>((r) => {
    clearCanvas();

    const enemyMovingIntervalID = setInterval(() => {
      moveEnemies(enemyList, drawingMatrix);
      spawnNewEnemie(difficulty, enemyList)
      difficulty++;
      clearCanvas()
      renderDrawing(drawingMatrix)
      enemyList.forEach(e => renderEnemy(e))
      if (getCurrentHP() === 0) r(getScore())
    }, 100)

    cleanUp.push(() => clearInterval(enemyMovingIntervalID))
  })

  finalScoreElement.innerText = finalScore.toString()
  gameOver.style.display = "grid"
  gameStart.style.display = "none"
  gameCanvas.style.display = "none"

  cleanUp.forEach(f => f())
}

gameStart.addEventListener("click", startGame)
againElement.addEventListener("click", startGame)
