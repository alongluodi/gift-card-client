/**
 * 本地演示数据层
 *
 * 只在 VITE_USE_MOCK=true 时生效，拦截 request() 发出的所有接口调用。
 * 不依赖后端即可走通完整链路：卡密验证 -> 选商品 -> 填地址 -> 查订单 -> 看物流。
 */

const ok = (data, msg = 'ok') => ({ code: 200, msg, data })
const fail = (msg) => ({ code: 400, msg, data: null })

const CARD = {
  id: 10001,
  card_no: 'CARD20260001',
  card_pwd: '888888',
  status: 0,
  expire_time: '2027-12-31 23:59:59'
}

const ACTIVITY = {
  id: 2026,
  title: '春日好礼兑换活动',
  cover: '/static/images/demo/banner-2.png',
  exchange_mode: 2,
  max_amount: 500,
  max_category: 3,
  max_quantity: 5,
  start_time: '2026-01-01 00:00:00',
  end_time: '2027-12-31 23:59:59',
  hide_price: 0,
  area_limit: []
}

const GOODS = [
  { id: 301, name: '精品红茶礼盒', cover: '/static/images/demo/goods-1.png', price: 168, stock: 36 },
  { id: 302, name: '手冲咖啡套装', cover: '/static/images/demo/goods-2.png', price: 238, stock: 18 },
  { id: 303, name: '轻奢点心礼盒', cover: '/static/images/demo/goods-3.png', price: 128, stock: 8 }
]

const GOODS_DETAIL = {
  301: { ...GOODS[0], images: ['/static/images/demo/goods-1.png', '/static/images/demo/banner-1.png'], detail: '<p>精选春茶，独立小包装，附带手提礼袋。</p>' },
  302: { ...GOODS[1], images: ['/static/images/demo/goods-2.png'], detail: '<p>含手冲壶、滤杯与挂耳咖啡，新手也能轻松上手。</p>' },
  303: { ...GOODS[2], images: ['/static/images/demo/goods-3.png'], detail: '<p>多口味点心组合，适合节日馈赠。</p>' }
}

const AREAS = {
  0: [{ id: 1, name: '北京市' }, { id: 2, name: '上海市' }, { id: 3, name: '广东省' }],
  1: [{ id: 11, name: '市辖区' }],
  2: [{ id: 21, name: '市辖区' }],
  3: [{ id: 31, name: '广州市' }, { id: 32, name: '深圳市' }],
  11: [{ id: 111, name: '朝阳区' }, { id: 112, name: '海淀区' }],
  21: [{ id: 211, name: '黄浦区' }, { id: 212, name: '徐汇区' }],
  31: [{ id: 311, name: '天河区' }],
  32: [{ id: 321, name: '南山区' }]
}

const TRACES = [
  { AcceptTime: '2026-11-18 16:20:00', AcceptStation: '快件已到达【演示市转运中心】' },
  { AcceptTime: '2026-11-18 09:10:00', AcceptStation: '快件已从【演示市分拨中心】发出' },
  { AcceptTime: '2026-11-17 20:35:00', AcceptStation: '商家已发货，快递公司已揽收' }
]

/** 根据 URL 后缀匹配接口 */
export function mockRequest(url, method = 'GET', data = {}) {
  const path = String(url || '')
  const upper = String(method || 'GET').toUpperCase()

  // ---- 提货卡业务接口 ----
  if (path.includes('/verify') && upper === 'POST') {
    if (String(data.card_no || '').toUpperCase() === CARD.card_no && data.card_pwd === CARD.card_pwd) {
      return ok({ ...CARD, activity: { id: ACTIVITY.id, title: ACTIVITY.title } }, '验证成功')
    }
    return fail('卡号或密码错误（演示卡号：CARD20260001 / 888888）')
  }

  if (path.includes('/api-activity/')) {
    if (!data.card_id || data.card_id === CARD.card_pwd) {
      return ok({ activity: ACTIVITY, goods: GOODS, card: { ...CARD, card_pwd: CARD.card_pwd }, is_enable: 1 })
    }
    return fail('卡号或密码错误')
  }

  if (path.includes('/pickup') && upper === 'POST') {
    return ok({ order_no: 'DEMO202611180001', status: 0 }, '预约成功')
  }

  if (path.includes('/query')) {
    return ok({
      order_no: 'DEMO202611180001',
      activity_title: ACTIVITY.title,
      status: 1,
      create_time: '2026-11-18 10:22:00',
      contact: '王女士',
      mobile: '138****8888',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      address: '演示路 88 号 3 栋 501',
      express_company: '演示快递',
      express_company_code: 'DEMO',
      express_no: 'DEMO1234567890',
      goods: [
        { goods_name: '精品红茶礼盒', quantity: 1 },
        { goods_name: '手冲咖啡套装', quantity: 1 }
      ]
    })
  }

  if (path.includes('/banners')) {
    return ok([
      { id: 1, image: '/static/images/demo/banner-1.png', title: '春日好礼' },
      { id: 2, image: '/static/images/demo/banner-2.png', title: '精选礼盒' },
      { id: 3, image: '/static/images/demo/banner-3.png', title: '兑换须知' }
    ])
  }

  if (path.includes('/activities')) {
    return ok([{ ...ACTIVITY, id: 2026 }])
  }

  if (path.includes('/api-setting')) {
    return ok({
      is_enable: 1,
      notice: '<p>1. 输入卡号密码后选择心仪礼品；<br/>2. 填写收货地址并提交预约；<br/>3. 在「发货查询」中查看订单状态。</p>',
      contact: '在线客服',
      service_mobile: '400-000-0000'
    })
  }

  if (path.includes('/express-track')) {
    return ok({ state: '3', state_text: '运输中', express_name: '演示快递', traces: TRACES })
  }

  if (path.includes('/goods-detail/')) {
    const id = Number(path.split('/goods-detail/')[1]?.split('?')[0]) || 301
    const goods = GOODS_DETAIL[id] || GOODS_DETAIL[301]
    return ok({ ...goods, hide_price: 0 })
  }

  if (path.includes('/area')) {
    return ok(AREAS[String(data.parent_id ?? 0)] || [])
  }

  // ---- 站点与用户接口 ----
  if (path.includes('/siteInfo')) {
    return ok({
      site_name: '提货卡演示站',
      site_logo: '/static/logo.png',
      site_desc: '输入卡号密码，在线兑换礼品',
      site_record_number: '',
      site_copyright: '© 2026 提货卡演示站',
      site_config: ''
    })
  }

  if (path.includes('/userInfo')) {
    return ok({ id: 1, username: 'demo', nickname: '演示用户', avatar: '/static/images/login/mine_avatar.png', mobile: '138****8888' })
  }

  if (path.includes('/dictData')) return ok([])
  if (path.includes('/banner')) return ok([])
  if (path.includes('/category')) return ok([])
  if (path.includes('/articleList')) return ok({ list: [], total: 0 })
  if (path.includes('/articleDetail')) return ok({ title: '演示文章', content: '<p>演示内容</p>' })
  if (path.includes('/protocol')) return ok({ title: '用户协议', content: '<p>演示协议内容</p>' })
  if (path.includes('/captcha')) return ok({ uuid: 'demo', img: '' })
  if (path.includes('/accountLogin') || path.includes('/phoneLogin') || path.includes('/mnpLogin')) {
    return ok({ access_token: 'demo-token', token_type: 'Bearer', user: { id: 1, username: 'demo' } }, '登录成功')
  }
  if (path.includes('/sendCode') || path.includes('/sendEmail') || path.includes('/sendForgotEmail')) {
    return ok(null, '验证码已发送（演示模式）')
  }
  if (path.includes('/logsDetail')) return ok([])
  if (path.includes('/viewArticle') || path.includes('/updateProfile')) return ok(null)

  // 未覆盖的接口返回空数据，避免白屏；开发时可在控制台看到提示
  console.warn('[mock] 未覆盖接口：', upper, path)
  return ok({})
}

export default mockRequest
