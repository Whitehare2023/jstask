// SPDX-License-Identifier: GPL-3.0
pragma solidity^0.6.10;
pragma experimental ABIEncoderV2;

import "./Token.sol";
import "./User.sol";

struct TaskInfo{
    string issuer;
    string worker;
    string desc;
    uint256 bonus;
    uint8 status;//0-已发布，1-已接受，2-已提交，3-已确认
    uint256 timestamp;
    string comment;// 任务执行效果评价
}

contract Task{
    Token _token;
    User _user;
    address _admin;
    address _owner;
    TaskInfo[] _tasks;
    using strings for string; 
    constructor(address owner)public{
        _admin = msg.sender;
        _owner = owner;
        _token = new Token();
        _user = new User(); 
    }

    // 总的发行量
    function totalSupply() external view returns (uint256){
        return _token.totalSupply();
    }
    // 用户余额
    function balanceOf(string calldata _owner) external view returns (uint256 balance){
        return _token.balanceOf(_owner);
    }
    // 转账
    function transfer(string calldata _from,string calldata _to, uint256 _value) external returns (bool success){
        _token.transfer(_from,_to,_value);
    }
    
    function mint(string calldata _to, uint256 _value)external{
        require(_admin == msg.sender || _owner == msg.sender,"Only admin can do this!");
        _token.mint(_to,_value);
    }

    // 注册接口设计
    function register(string calldata username,string calldata passwd) external{
        // 检测条件：用户没注册过，用户和密码不能为空
        _user.register(username,passwd);
    }
    // 登录接口设计
    function login(string calldata username,string calldata passwd)external view returns(bool){
        // require(!username.isEqual(""),"Username must not null.");
        // require(!passwd.isEqual(""),"Passwd must not null.");
        return _user.login(username,passwd);
    }
    // 发布任务
    function issue(string calldata issuer,string calldata passwd,string calldata desc,uint256 bonus)external {
        require(_user.login(issuer,passwd),"issuer must have his right");
        require(bonus > 0,"bonus must > 0");
        require(_token.balanceOf(issuer) >= bonus,"issuer's bonus must enough");
        TaskInfo memory task = TaskInfo(issuer,"",desc,bonus,0,block.timestamp,"");
        _tasks.push(task);
    }
    // 接受任务
    function take(string calldata worker,string calldata passwd,uint256 taskID)external{
        require(_user.login(worker,passwd),"worker must have his right");
        require(_tasks[taskID].timestamp > 0,"task must exists");
        require(_tasks[taskID].status == 0,"task's status must == 0");
        _tasks[taskID].worker = worker;
        _tasks[taskID].status = 1;// 任务已发布
    }
    // 提交任务
    function commit(string calldata worker,string calldata passwd,uint256 taskID)external{
        require(_user.login(worker,passwd),"worker must have his right");
        require(_tasks[taskID].timestamp > 0,"task must exists");
        require(_tasks[taskID].status == 1,"task's status must == 1");
        require(worker.isEqual(_tasks[taskID].worker),"task's works must is worker");
        _tasks[taskID].status = 2;// 任务已提交
    }
    // 确认任务
    function confirm(string calldata issuer,string calldata passwd,uint256 taskID,string calldata comment,uint8 status)external{
        require(_user.login(issuer,passwd),"worker must have his right");
        require(_tasks[taskID].timestamp > 0,"task must exists");
        require(_tasks[taskID].status == 2,"task's status must == 2");
        require(issuer.isEqual(_tasks[taskID].issuer),"task's issuer must is issuer");
        require(status == 3 || status == 1);
        _tasks[taskID].status = status;// 任务已确认
        _tasks[taskID].comment = comment;
        if (status == 3){
            // 代表确认通过
            _token.transfer(issuer,_tasks[taskID].worker,_tasks[taskID].bonus);
        }
    }

    // 查询接口
    function qryOneTask(uint256 taskID)external view returns(string memory,string memory,uint256,string memory,uint8){
        return (_tasks[taskID].issuer,_tasks[taskID].desc,_tasks[taskID].bonus,_tasks[taskID].worker,_tasks[taskID].status);
    }

    // 查询所有任务
    function qryAllTasks()external view returns(TaskInfo[] memory){
        return _tasks;
    }

}