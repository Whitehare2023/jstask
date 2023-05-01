// SPDX-License-Identifier: GPL-3.0
pragma solidity^0.6.10;

abstract contract IUSER{
    // 注册接口设计
    function register(string calldata username,string calldata passwd)virtual external;
    // 登录接口设计
    function login(string calldata username,string calldata passwd)virtual external view returns(bool);
}