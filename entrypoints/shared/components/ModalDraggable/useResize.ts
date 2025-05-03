import * as React from 'react'
import {useState, useEffect, useCallback} from 'react'
import {MIN_HEIGHT, MIN_WIDTH, EDGE_PADDING} from './constant'

export type ResizeDirection =
    | 'right'
    | 'bottom'
    | 'left'
    | 'top'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'

interface InitialState {
    initX: number
    initY: number
    initWidth: number
    initHeight: number
    mouseDownX: number
    mouseDownY: number
}


export const useResize = (
    x: number,
    y: number,
    width: number,
    height: number,
    direction: ResizeDirection,
    onResize: (args: { x: number; y: number; width: number; height: number }) => void,
): ((e: React.MouseEvent) => void) => {
    const [dragging, setDragging] = useState(false)

    const positionRef = React.useRef({x, y, width, height})

    // 🔁 Оновлюємо актуальні значення при зміні
    useEffect(() => {
        positionRef.current = {x, y, width, height}
    }, [x, y, width, height])

    const initialRef = React.useRef<InitialState>({
        initX: 0,
        initY: 0,
        initWidth: 0,
        initHeight: 0,
        mouseDownX: 0,
        mouseDownY: 0,
    })

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()

        const {x, y, width, height} = positionRef.current

        initialRef.current = {
            initX: x,
            initY: y,
            initWidth: width,
            initHeight: height,
            mouseDownX: e.clientX,
            mouseDownY: e.clientY,
        }

        setDragging(true)
    }, [])

    useEffect(() => {
        const onMouseMove = (e: MouseEvent): void => {
            if (!dragging) return

            const {
                initX,
                initY,
                initWidth,
                initHeight,
                mouseDownX,
                mouseDownY,
            } = initialRef.current

            const dx = e.clientX - mouseDownX
            const dy = e.clientY - mouseDownY

            let newX = initX
            let newY = initY
            let newWidth = initWidth
            let newHeight = initHeight

            if (direction.includes('right')) {
                // Calculate new width based on mouse movement
                const candidateWidth = initWidth + dx
                
                // Ensure width is at least MIN_WIDTH
                newWidth = Math.max(candidateWidth, MIN_WIDTH)
                
                // Get window width to enforce maximum constraint
                const windowWidth = window.innerWidth
                
                // Ensure width doesn't exceed window width minus padding and position
                const maxWidth = windowWidth - initX - EDGE_PADDING * 2
                if (newWidth > maxWidth) {
                    newWidth = maxWidth
                }
            }

            // if (direction.includes('left')) {
            //     // Поточна позиція курсора
            //     let delta = e.clientX - mouseDownX
            //
            //     // Максимальний зсув вліво, який ще дозволяє дотриматись MIN_WIDTH
            //     const maxDelta = initWidth - MIN_WIDTH
            //
            //     // обмежуємо дельту (не можна зменшити ширину менше мінімальної)
            //     if (delta > maxDelta) delta = maxDelta
            //
            //     newWidth = initWidth - delta
            //
            //     // зміщення X координати разом з лівим краєм (якщо рухаємось вліво)
            //     // якщо ширина вже MIN_WIDTH, не рухаємо X далі, інакше буде "jump"
            //     if (newWidth > MIN_WIDTH) {
            //         newX = initX + delta
            //     } else {
            //         // залишаємо позицію фіксованою, щоб не зміщувалось вліво, коли вже MIN_WIDTH
            //         // (альтернатива — зафіксувати на момент mouseDownX, але це теж нестабільно)
            //         newX = initX + (initWidth - MIN_WIDTH)
            //     }
            //
            //     /*
            //         🔍 Debug-приклад:
            //         initX = 200
            //         initWidth = 300
            //         mouseDownX = 220
            //         e.clientX = 270 → delta = 50
            //         maxDelta = 300 - 100 = 200 → ок
            //
            //         newWidth = 300 - 50 = 250
            //         newX = 200 + 50 = 250
            //
            //         ⛔ Якщо курсор дійшов до точки, де ширина = 100:
            //         delta = 200 → newWidth = 100 → newX = 200 + 200 = 400 ← це не можна!
            //         потрібно зупинити newX на:
            //         newX = initX + (initWidth - MIN_WIDTH) = 200 + 200 = 400 ✅
            //     */
            // }

            if (direction.includes('left')) {
                // Calculate new width respecting minimum width
                const candidateWidth = initWidth - dx
                
                // Get window width to enforce maximum constraint
                const windowWidth = window.innerWidth
                
                // Calculate maximum width based on position and padding
                const maxWidth = initX + initWidth - EDGE_PADDING
                
                if (candidateWidth >= MIN_WIDTH) {
                    // Apply width within constraints
                    newWidth = Math.min(candidateWidth, maxWidth)
                    
                    // Adjust x position based on width change
                    const widthDelta = initWidth - newWidth
                    newX = initX + widthDelta
                } else {
                    // If we would go below minimum width, cap at minimum width
                    // and adjust position accordingly
                    newWidth = MIN_WIDTH
                    newX = initX + (initWidth - MIN_WIDTH)
                }
            }


            if (direction.includes('bottom')) {
                // Calculate new height based on mouse movement
                const candidateHeight = initHeight + dy
                
                // Ensure height is at least MIN_HEIGHT
                newHeight = Math.max(candidateHeight, MIN_HEIGHT)
                
                // Get window height to enforce maximum constraint
                const windowHeight = window.innerHeight
                
                // Ensure height doesn't exceed window height minus padding and position
                const maxHeight = windowHeight - initY - EDGE_PADDING * 2
                if (newHeight > maxHeight) {
                    newHeight = maxHeight
                }
            }
            if (direction.includes('top')) {
                // Calculate new height respecting minimum height
                const candidateHeight = initHeight - dy
                
                // Get window height to enforce maximum constraint
                const windowHeight = window.innerHeight
                
                // Calculate maximum height based on position and padding
                const maxHeight = initY + initHeight - EDGE_PADDING
                
                if (candidateHeight >= MIN_HEIGHT) {
                    // Apply height within constraints
                    newHeight = Math.min(candidateHeight, maxHeight)
                    
                    // Adjust y position based on height change
                    const heightDelta = initHeight - newHeight
                    newY = initY + heightDelta
                } else {
                    // If we would go below minimum height, cap at minimum height
                    // and adjust position accordingly
                    newHeight = MIN_HEIGHT
                    newY = initY + (initHeight - MIN_HEIGHT)
                }
            }

            onResize({x: newX, y: newY, width: newWidth, height: newHeight})
        }

        const onMouseUp = () => setDragging(false)

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)

        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [dragging, direction, onResize])

    return onMouseDown
}