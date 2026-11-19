import request from '@/utils/request'

/** 基本信息 */
export function userInfoApi() {
    return request('/app/user/user/userInfo', 'get', {}, false, true)
}

/** 修改资料 */
export function updateProfileApi(params = {}) {
    return request('/app/user/user/updateProfile', 'post', params)
}

/** 日志详情 */
export function logsDetailApi(params = {}) {
    return request('/app/user/user/logsDetail', 'get', params)
}
