// 提货卡相关API — 必须通过 request() 以自动携带 X-Tenant-Code header
import request from '@/utils/request'

// 代理模式：interfaceUrl()=/api，路径用 /gift/xxx → 代理剥离 /api → 匹配 Route::group('/gift')
// 直连模式：interfaceUrl()=base_url，路径用 /api/gift/xxx → 匹配 Route::group('/api/gift')
const isProxy = import.meta.env.VITE_APP_OPEN_PROXY === 'true'
const baseUrl = isProxy ? '/gift' : '/api/gift'

/**
 * 验证卡密
 */
export function verifyCard(data) {
  return request(baseUrl + '/verify', 'POST', data)
}

/**
 * 获取活动详情（携带 card_id 用于卡密验证）
 */
export function getActivityDetail(id, cardId) {
  const params = cardId ? { card_id: cardId } : {}
  return request(baseUrl + '/api-activity/' + id, 'GET', params)
}

/**
 * 提交预约
 */
export function submitPickup(data) {
  return request(baseUrl + '/pickup', 'POST', data)
}

/**
 * 查询订单
 */
export function queryOrder(cardNo, cardPwd) {
  return request(baseUrl + '/query', 'GET', { card_no: cardNo, card_pwd: cardPwd })
}

/**
 * 获取轮播图
 */
export function getBanners() {
  return request(baseUrl + '/banners', 'GET')
}

/**
 * 获取活动列表
 */
export function getActivityList() {
  return request(baseUrl + '/activities', 'GET')
}

/**
 * 获取提货设置
 */
export function getSetting() {
  return request(baseUrl + '/api-setting', 'GET')
}

/**
 * 查询物流轨迹
 * @param {string} expressCode 快递公司编码
 * @param {string} expressNo 快递单号
 * @param {string} mobile 收件人手机号（可选）
 * @param {string} cardNo 兑换卡号（可选，用于记录关联）
 */
export function queryExpressTrack(expressCode, expressNo, mobile = '', cardNo = '') {
  return request(baseUrl + '/express-track', 'GET', { express_code: expressCode, express_no: expressNo, mobile, card_no: cardNo })
}

/**
 * 获取商品详情（富文本详情 + 图集）
 * @param {number|string} id 商品ID
 * @param {number|string} activityId 活动ID（可选）：传入后后端会返回该活动的 hide_price，
 *   用于「不显示商品价格」的活动在商品详情页也隐藏价格
 */
export function getGoodsDetail(id, activityId) {
  const params = activityId ? { activity_id: activityId } : {}
  return request(baseUrl + '/goods-detail/' + id, 'GET', params)
}

/**
 * 获取省市区数据
 * @param {number} parentId 父级ID，0=省份
 */
export function getArea(parentId = 0) {
  return request(baseUrl + '/area', 'GET', { parent_id: parentId })
}
