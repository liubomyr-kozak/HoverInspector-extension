import * as React from 'react'
import {useEffect, useReducer} from 'react'
import {getWindowSize} from './store/getWindowSize.ts'
import {useDispatch} from "react-redux";
import {windowResizeForModal} from './store/draggableModalSlice.ts'

export const DraggableModalProvider = ({
                                           children,
                                       }: {
    children: React.ReactNode
}): React.ReactElement => {
    // const [state, dispatch] = useReducer(draggableModalReducer, initialModalsState)

    const dispatch = useDispatch()

    useEffect(() => {
        if (typeof window !== 'object') {
            return
        }

        const onResize = () => {
            dispatch(windowResizeForModal(getWindowSize()))
        }

        window.addEventListener('resize', onResize)

        onResize()

        return () => window.removeEventListener('resize', onResize)
    }, [dispatch])


    return <>{children}</>
}
