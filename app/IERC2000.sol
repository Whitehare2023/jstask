// SPDX-License-Identifier: GPL-3.0
pragma solidity^0.6.10;

interface IERC2000{
    // 总的发行量
    function totalSupply() external view returns (uint256);
    // 用户余额
    function balanceOf(string calldata _owner) external view returns (uint256 balance);
    // 转账
    function transfer(string calldata _from,string calldata _to, uint256 _value) external returns (bool success);
    

}