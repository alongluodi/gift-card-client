import request from '@/utils/request'

/** 分类列表 */
export function categoryApi(params = {}) {
    return request('/app/user/cms/category', 'get', params)
}

/** 轮播列表 */
export function bannerApi(params = {}) {
    return request('/app/user/cms/banner', 'get', params)
}

/** 文章列表 */
export function articleListApi(params = {}) {
    return request('/app/user/cms/articleList', 'get', params)
}

/** 文章详情 */
export function articleDetailApi(params = {}) {
    return request('/app/user/cms/articleDetail', 'get', params)
}

/** 文章阅读 */
export function viewArticleApi(params = {}) {
    return request('/app/user/cms/viewArticle', 'post', params)
}
