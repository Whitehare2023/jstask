// SPDX-License-Identifier: GPL-3.0
pragma solidity^0.6.10;

contract hello{
    string hellomsg;
    constructor(string memory _msg)public {
        hellomsg = _msg;
    }
    function setMsg(string memory _msg)public{
        hellomsg = _msg;
    }
    function getMsg()public view returns(string memory){
        return hellomsg;
    }
}