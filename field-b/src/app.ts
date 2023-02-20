import { createBall, drawBall, initBallControl, updateBall } from './_ball'
import { Presence } from './_types'

const mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement
const cW = mainCanvas.width = window.innerWidth
const cH = mainCanvas.height = cW * 0.56
const mainContext = mainCanvas.getContext('2d')

const cWhite: RGB = [250, 250, 250]
const cStraw: RGB = [123, 102, 78]
const cStrawLight: RGB = [114, 95, 71]
const numBlades = 600

const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0e0e0e'
    ctx.fillRect(0, 0, cW, cH)
}

const deviate = (num: number, up: number, low: number): number => {
    const ran = Math.random() // 0.0 to 1.0
    const multi = ran + 0.5 // 0.5 to 1.5
    const deviation = num * multi
    if (deviation > (num * up)) return deviate(num, up, low)
    if (deviation < (num * low)) return deviate(num, up, low)
    return deviation
}

const maxMin = (num: number, max: number, min: number): number => {
    const numUp = Math.min(num, max) // no more than top
    const numLow = Math.max(numUp, min) // no less than bottom
    return numLow
}

const flip = (): -1 | 1 => Math.random() > 0.5 ? 1 : -1

type RGB = [number, number, number]

interface GrassBlade {
    /** Direction multiplier (-1 OR 1) */
    xF: -1 | 1,
    /** Height */
    h: number,
    x: number,
    y: number,
    /** Mid-point X */
    x1: number,
    x2: number,
    /** Mid-point Y */
    y1: number,
    y2: number,
    /** Radians */
    rad: number,
    /** Colour */
    c: string,
    /** Line Width */
    lW: number,
    /** Rotation */
    rot: number
}

const drawGrassBlade = (ctx: CanvasRenderingContext2D, b: GrassBlade, objects: Presence[]) => {
    updateGrassBlade(b, objects)
    
    ctx.beginPath()
    ctx.strokeStyle = b.c
    ctx.lineWidth = b.lW
    ctx.translate(b.x, b.y)
    ctx.moveTo(0, 0)
    ctx.rotate((b.rot * Math.PI) / 180);
    ctx.arcTo(b.x1, b.y1, b.x2, b.y2, b.rad)
    ctx.stroke()
    ctx.closePath()
    ctx.resetTransform()
}

interface Pos {
    xL: number,
    xR: number,
    zT: number,
    zB: number
}

const pos = (o: Presence): Pos => {
    const halfWidth = o.width / 2
    const xL = o.x - halfWidth
    const xR = o.x + halfWidth
    const zT = o.y - halfWidth
    const zB = o.y + halfWidth
    
    return { xL, xR, zT, zB }
}

const rotGrassDown = -1 * deviate(70, 1.5, -1.5)
const rotGrassUp = -1 * deviate(30, 1.5, -1.5)

const updateGrassBlade = (b: GrassBlade, objects: Presence[]) => {
    const shift = deviate(0.5, 1, -1) * flip()
    b.x1 = maxMin(b.x1 + shift, 10, 0 - 10)
    b.x2 = maxMin(b.x2 + shift, 50, 0 - 50)

    if (objects.map(pos).some(o => b.x > o.xL && b.x < o.xR && b.y > o.zT && b.y < o.zB)) {
        b.rot = rotGrassDown
    } else {
        b.rot = rotGrassUp
    }
}

const createGrassBlade = (x: number, y: number, rgbBase: RGB = cWhite): GrassBlade => {
    const dX: number = deviate(x, 1.5, 0.5)
    const dY: number = y + (deviate(1, 1, 0) * flip())
    const xF = flip()
    const h = deviate(120, 2, 0.3)
    const rgbDev = (deviate(5, 1, -1) * flip())
    const alpha = 0.5 + deviate(0.25, 1.5, 0.5)

    const b: GrassBlade = {
        xF,
        h,
        x: dX,
        y: dY,
        x1: 0 + (5 * xF),
        x2: 0 + (35 * xF),
        y1: 0 - (h/2),
        y2: 0 - h,
        rad: deviate(30, 1.5, 0.5),
        c: `rgba(${rgbBase[0] + rgbDev}, ${rgbBase[1] + rgbDev}, ${rgbBase[2] + rgbDev}, ${alpha})`,
        lW: 1,
        rot: rotGrassUp
    }

    return b
}

const grassBladesA: GrassBlade[] = []
const grassBladesB: GrassBlade[] = []
const grassBladesC: GrassBlade[] = []

const drawGrassBlades = (ctx: CanvasRenderingContext2D, x: number, y: number, rgb: RGB, grassBlades: GrassBlade[], objects: Presence[]) => {
    if (grassBlades.length <= numBlades) {
        for (let i = 0; i < numBlades; i++) {
            grassBlades.push(createGrassBlade(x, y, rgb))
        }
    }

    for (let i = 0; i < numBlades; i++) {
        drawGrassBlade(ctx, grassBlades[i], objects)
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const times: number[] = [];
let fps: number = 0;
const animFrames = (ctx: CanvasRenderingContext2D) => {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;

    ctx.fillStyle = '#fff'
    ctx.fillText(fps.toString(), 10, 20, 200)
    ctx.fillText(cW.toString(), 10, 60, 200)
    ctx.fillText(cH.toString(), 10, 100, 200)
}

const b = createBall(cW / 2, (cH / 2) + 100)
initBallControl(b)

const sceneObjects: Presence[] = [b]

const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, cW, cH)
    drawBackground(ctx)
    drawGrassBlades(ctx, cW / 2 - 30, cH / 2 - 10, cStraw, grassBladesA, sceneObjects)
    drawGrassBlades(ctx, cW / 2 + 20, cH / 2 - 5, cStrawLight, grassBladesB, sceneObjects)
    drawGrassBlades(ctx, cW / 2, cH / 2, cStraw, grassBladesC, sceneObjects)
    updateBall(b)
    drawBall(ctx, b)
    animFrames(ctx)
    window.requestAnimationFrame(() => draw(ctx))
}

if (mainContext) draw(mainContext)

