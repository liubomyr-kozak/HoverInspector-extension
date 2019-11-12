import React from "react";
import './sidebar-header.scss'
import {isProduction} from "../../../providers/helpers";

export const SidebarHeader = ({toggleSidebarVisible}) => {
    return (
        <div className='wb-sidebar-header flex align-center'>
             <span className='btn btn-transp color-white'>
                    <i className='material-icons flex'>menu</i>
                </span>
            <div className='margin-left-auto wb-sidebar-header-logo'>
                Wordberry
                <span className="wb-sidebar-header-logo-mode">{isProduction() ? 'production' : 'development'}</span>
            </div>
            <div className='wb-sidebar-close-btn' onClick={toggleSidebarVisible}>
                <span className='btn btn-transp color-white'>
                    <i className='material-icons flex'>close</i>
                </span>
            </div>
        </div>
    )
};