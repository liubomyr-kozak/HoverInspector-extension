import React from 'react';
import './sidebar.scss';
import {SearchBox} from "./components/search-box/search-box";
import {SidebarHeader} from "./components/sidebar-header/sidebar-header";
import {SidebarFooter} from "./components/sidebar-footer/sidebar-footer";
import {WordsList} from "./components/words-list/words-list"

const Sidebar = ({isSidebarVisible, toggleVisible}) => {
    return (
        <div className={`wb-sidebar ${isSidebarVisible ? 'wb-show-sidebar' : 'wb-hide-sidebar'}`}>
            <div className="wb-sidebar-container flex flex-column">
                <SidebarHeader toggleSidebarVisible={toggleVisible}/>
                {/*<div className="something">*/}
                    {/*<span className="btn btn-chat">*/}
                        {/*<i className="material-icons vertical-align-middle">chat</i>*/}
                        {/*chat*/}
                    {/*</span>*/}
                    {/*<span className="btn">*/}
                        {/*something*/}
                    {/*</span>*/}
                {/*</div>*/}
                <SearchBox/>
                <WordsList/>
                <SidebarFooter/>
            </div>
        </div>
    )
};


export default Sidebar