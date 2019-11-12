import React from "react";
import './sidebar-footer.scss';
import {useStateAppValue} from "../../../app-context";

export const SidebarFooter = () => {
    const [{wordsList}, dispatch] = useStateAppValue();

    return <div className="wb-sidebar-footer flex align-center">
        {/*<div className="wb-sidebar-footer-container flex align-center">*/}
        {wordsList.length
            ? (<span className="btn btn-delete btn-delete-footer">
                <i className="material-icons">delete_sweep</i>
            </span>)
            : ''
        }
        {/*</div>*/}
    </div>
};