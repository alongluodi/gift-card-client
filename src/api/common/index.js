import request from '@/utils/request'

/** 站点信息 */
export function siteInfoApi() {
    return request('/app/user/index/siteInfo', 'get')
}

/** 字典信息 */
export function dictDataApi(params = {}) {
    return request('/app/user/index/dictData', 'get', params)
}

/** 协议 */
export function protocol(type) {
    return request('/app/user/index/protocol?type=' + type, 'get')
}

/** 验证码 */
export function captchaApi(params = {}) {
    return request('/app/user/index/captcha', 'get', params)
}

/** 注册账户-发送邮件 */
export function sendEmailApi(params = {}) {
    return request('/app/user/index/sendEmail', 'post', params)
}

/** 找回密码-发送邮件 */
export function sendForgotEmailApi(params = {}) {
    return request('/app/user/index/sendForgotEmail', 'post', params)
}

/** 登录 */
export function loginApi(params = {}) {
    return request('/app/user/index/accountLogin', 'post', params)
}

/** 注册 */
export function registerApi(params = {}) {
    return request('/app/user/index/accountRegister', 'post', params)
}

/** 密码重置 */
export function emailResetApi(params = {}) {
    return request('/app/user/index/emailReset', 'post', params)
}

/** 发送短信验证码 */
export function sendCodeApi(params = {}) {
    return request('/app/user/index/sendCode', 'post', params)
}

/** 手机号登录 */
export function phoneLoginApi(params = {}) {
    return request('/app/user/index/phoneLogin', 'post', params)
}

/** 小程序登录 */
export function mnpLoginApi(params = {}) {
    return request('/app/user/index/mnpLogin', 'post', params)
}

/** 微信公众号-构造OAuth 链接 */
export function wechatOauthApi(params = {}) {
    return request('/app/user/index/wechatOauth', 'post', params)
}

/** 微信公众号-登录 */
export function wechatLoginApi(params = {}) {
    return request('/app/user/index/wechatLogin', 'post', params)
}

/** 企业微信-构造OAuth 链接 */
export function workOauthApi(params = {}) {
    return request('/app/user/index/workOauth', 'post', params)
}

/** 企业微信-登录 */
export function workLoginApi(params = {}) {
    return request('/app/user/index/workLogin', 'post', params)
}

/** 钉钉-获取CorpId */
export function dingtalkCropIdApi(params = {}) {
    return request('/app/user/index/dingtalkCropId', 'post', params)
}

/** 钉钉-登录 */
export function dingtalkLoginApi(params = {}) {
    return request('/app/user/index/dingtalkLogin', 'post', params)
}
