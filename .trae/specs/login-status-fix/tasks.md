# 登录状态修复 - 实现计划

## [x] 任务 1：修复注册成功后 token 未保存的问题
- **优先级**：P0
- **依赖**：无
- **描述**：
  - 修改 api.ts 文件中的 register 方法，确保注册成功后将 token 保存到 localStorage
  - 参考 login 方法的实现，在 register 方法中添加 token 保存逻辑
- **Acceptance Criteria Addressed**：AC-1
- **Test Requirements**：
  - `programmatic` TR-1.1：注册成功后，localStorage 中应该包含 token
  - `human-judgment` TR-1.2：注册成功后，用户应该能够直接访问需要认证的 API
- **Notes**：确保 register 方法的实现与 login 方法保持一致

## [x] 任务 2：优化注册成功后的导航逻辑
- **优先级**：P0
- **依赖**：任务 1
- **描述**：
  - 修改 RegisterScreen 组件，将注册成功后的导航目标从登录页面改为发现页面
  - 这样用户注册成功后就不需要再次登录了
- **Acceptance Criteria Addressed**：AC-2
- **Test Requirements**：
  - `human-judgment` TR-2.1：注册成功后，用户应该被导航到发现页面
  - `human-judgment` TR-2.2：注册成功后，用户应该能够直接访问需要认证的 API
- **Notes**：确保导航逻辑与登录成功后的导航逻辑保持一致

## [x] 任务 3：改进个人中心页面的错误处理
- **优先级**：P0
- **依赖**：任务 1
- **描述**：
  - 修改 ProfileScreen 组件，改进错误处理逻辑
  - 在获取用户个人资料失败时，显示未登录状态，而不是显示错误信息
- **Acceptance Criteria Addressed**：AC-3, AC-4
- **Test Requirements**：
  - `human-judgment` TR-3.1：用户已登录时，个人中心页面应该显示用户信息
  - `human-judgment` TR-3.2：用户未登录或 token 无效时，个人中心页面应该显示未登录状态
- **Notes**：确保错误处理逻辑能够正确区分认证错误和其他错误

## [x] 任务 4：测试修复后的功能
- **优先级**：P1
- **依赖**：任务 1, 任务 2, 任务 3
- **描述**：
  - 测试注册功能，确保注册成功后 token 被保存
  - 测试登录功能，确保登录成功后 token 被保存
  - 测试个人中心页面，确保登录状态正确显示
  - 测试退出登录功能，确保登录状态被正确清除
- **Acceptance Criteria Addressed**：AC-1, AC-2, AC-3, AC-4
- **Test Requirements**：
  - `human-judgment` TR-4.1：所有功能应该正常工作
  - `human-judgment` TR-4.2：用户体验应该流畅
- **Notes**：在测试过程中，确保清除浏览器缓存，以避免缓存导致的问题