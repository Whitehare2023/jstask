// SPDX-License-Identifier: GPL-3.0
pragma solidity^0.6.10;

import "./IUSER.sol";
import "./strings.sol";

contract User is IUSER{
    mapping(string=>string) _users;
    address admin;
    using strings for string;// string类型的变量可以使用strings库的函数
    constructor()public{
        admin = msg.sender;
    }

    // 注册接口设计
    function register(string calldata username,string calldata passwd)override external{
        // 检测条件：用户没注册过，用户和密码不能为空
        require(!username.isEqual(""),"Username must not null.");
        require(!passwd.isEqual(""),"Passwd must not null.");
        require(_users[username].isEqual(""),"User must not exist.");
        _users[username] = passwd;
    }
    // 登录接口设计
    function login(string calldata username,string calldata passwd)override external view returns(bool){
        // require(!username.isEqual(""),"Username must not null.");
        // require(!passwd.isEqual(""),"Passwd must not null.");
        if (username.isEqual("") || passwd.isEqual("")){
            return false;
        }
        return _users[username].isEqual(passwd);
    }
}