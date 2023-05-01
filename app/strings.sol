// SPDX-License-Identifier: GPL-3.0
pragma solidity^0.6.10;

library strings{
    function isEqual(string memory a,string memory b)internal pure returns(bool){
        // 借助哈希函数防碰撞特性
        // 若 hash(a) != hash(b),认为a != b
        bytes32 hashA = keccak256(abi.encode(a));
        bytes32 hashB = keccak256(abi.encode(b));
        return hashA == hashB;
    }
}