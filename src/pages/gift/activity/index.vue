<template>
  <view class="activity-page">
    <!-- 头部封面 -->
    <view class="cover-box">
      <image class="cover-image" :src="activity.cover" mode="aspectFill" v-if="activity.cover" />
      <view class="cover-placeholder" v-else>
        <text class="placeholder-icon">🎁</text>
      </view>
      <view class="cover-overlay">
        <text class="activity-title">{{ activity.title }}</text>
        <text class="activity-time" v-if="activity.start_time">
          {{ activity.start_time }} - {{ activity.end_time }}
        </text>
      </view>
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
    </view>
    
    <!-- 活动规则 -->
    <view class="rule-box" v-if="activity.exchange_mode">
      <view class="rule-title">兑换规则</view>
      <view class="rule-content">
        <view class="rule-item" v-if="activity.exchange_mode === 1">
          <text class="rule-icon">📦</text>
          <text class="rule-text">可兑换 {{ activity.max_category || 3 }} 种商品，单种最多 {{ activity.max_quantity || 5 }} 件</text>
        </view>
        <view class="rule-item" v-if="activity.exchange_mode === 2">
          <text class="rule-icon">💰</text>
          <text class="rule-text">单次最高兑换金额 ¥{{ activity.max_amount || 0 }}</text>
        </view>
        <view class="rule-item">
          <text class="rule-icon">📅</text>
          <text class="rule-text">有效期：{{ cardInfo.expire_time || '永久有效' }}</text>
        </view>
        <view class="rule-item" v-if="areaLimitList.length > 0">
          <text class="rule-icon">📍</text>
          <text class="rule-text">仅限以下省份收货：{{ areaLimitText }}</text>
        </view>
      </view>
    </view>
    
    <!-- 商品列表 -->
    <view class="goods-box">
      <view class="goods-title">
        <text>可选商品</text>
        <text class="goods-count" v-if="goodsList.length > 0">已选 {{ selectedGoods.length }} 种</text>
      </view>
      
      <view class="goods-loading" v-if="pageLoading">
        <text>加载中...</text>
      </view>
      
      <view class="goods-list" v-else-if="goodsList.length > 0">
        <view 
          class="goods-item" 
          v-for="item in goodsList" 
          :key="item.id"
        >
          <view class="goods-cover" @click="openQuickView(item)">
            <image :src="item.cover" mode="aspectFill" v-if="item.cover" />
            <view class="goods-placeholder" v-else>📦</view>
            <view class="goods-stock" v-if="item.stock <= 10">库存不足</view>
          </view>
          <view class="goods-info" @click="openQuickView(item)">
            <view class="goods-name">{{ item.name }}</view>
            <view class="goods-price" v-if="!hidePrice">¥{{ item.price }}</view>
            <view class="goods-detail-link">查看详情 ›</view>
          </view>
          <view class="goods-action">
            <view class="quantity-control" @click.stop="handleQuantity(item, -1)">
              <text>-</text>
            </view>
            <input 
              class="quantity-input" 
              type="number" 
              :value="getQuantity(item.id)"
              @input="handleInput($event, item)"
              @click.stop
            />
            <view class="quantity-control" @click.stop="handleQuantity(item, 1)">
              <text>+</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="goods-empty" v-else-if="!pageLoading">
        <text>暂无商品</text>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="total-info">
        <text class="total-label">已选商品：</text>
        <!-- 活动勾选「不显示商品价格」时，合计金额改为显示已选件数，不露出任何金额 -->
        <text class="total-value" v-if="!hidePrice">¥{{ totalAmount }}</text>
        <text class="total-value" v-else>{{ totalQuantity }} 件</text>
      </view>
      <button class="btn-submit" :class="{ disabled: !pickupEnabled }" @click="handleSubmit" :disabled="!pickupEnabled || selectedGoods.length === 0 || !cardInfo.id">
        {{ !pickupEnabled ? '暂停兑换礼品' : cardInfo.id ? '立即预约' : '请先验证卡密' }}
      </button>
    </view>
    
    <!-- 填写收货信息弹窗（表单区可滚动，按钮固定底部；键盘弹出时整体上移）
         H5 微信内置浏览器：fixed 定位不随键盘上移，用 visualViewport 计算键盘高度后抬高 bottom -->
    <view class="popup-mask" v-if="showAddressForm" @click="closeAddress">
      <view
        class="address-popup"
        :style="{ bottom: keyboardHeight + 'px', maxHeight: popupMaxHeight }"
        @click.stop
      >
        <view class="form-title">填写收货信息</view>

        <scroll-view
          scroll-y
          class="form-scroll"
          :style="{ maxHeight: formScrollMaxHeight }"
          :show-scrollbar="false"
          :enhanced="true"
          :scroll-into-view="scrollIntoView"
          :scroll-with-animation="true"
        >
          
          <view class="form-item" id="addr-contact">
            <text class="form-label">联系人</text>
            <view class="input-wrapper">
              <input class="form-input" v-model="addressForm.contact" placeholder="请输入收货人姓名" @focus="onFieldFocus('addr-contact')" />
              <view class="input-clear" v-if="addressForm.contact" @click="addressForm.contact = ''">✕</view>
            </view>
          </view>
          
          <view class="form-item" id="addr-mobile">
            <text class="form-label">联系电话</text>
            <view class="input-wrapper">
              <input class="form-input" v-model="addressForm.mobile" type="number" maxlength="11" placeholder="请输入手机号码" @focus="onFieldFocus('addr-mobile')" />
              <view class="input-clear" v-if="addressForm.mobile" @click="addressForm.mobile = ''">✕</view>
            </view>
          </view>
          
          <view class="form-item" id="addr-region">
            <text class="form-label">所在地区</text>
            <picker mode="multiSelector" :range="multiArray" range-key="name" :value="multiIndex" @columnchange="onRegionColumnChange">
              <view class="form-picker-row">{{ regionDisplayText }}</view>
            </picker>
          </view>
          
          <view class="form-item" id="addr-address">
            <text class="form-label">详细地址</text>
            <view class="input-wrapper">
              <textarea class="form-textarea" v-model="addressForm.address" placeholder="请输入详细收货地址" :auto-height="false" @focus="onFieldFocus('addr-address')" />
              <view class="input-clear textarea-clear" v-if="addressForm.address" @click="addressForm.address = ''">✕</view>
            </view>
          </view>

          <view class="form-item" id="addr-remark">
            <text class="form-label">备注 <text class="form-label-sub">（选填）</text></text>
            <view class="input-wrapper">
              <textarea class="form-textarea form-textarea-remark" v-model="addressForm.remark" placeholder="如有特殊要求请留言，最多200字" maxlength="200" :auto-height="false" @focus="onFieldFocus('addr-remark')" />
              <view class="input-clear textarea-clear" v-if="addressForm.remark" @click="addressForm.remark = ''">✕</view>
            </view>
          </view>
        </scroll-view>

        <view class="form-buttons">
          <button class="btn-cancel" @click="closeAddress">取消</button>
          <button class="btn-confirm" @click="handleConfirm">立即预约</button>
        </view>
      </view>
    </view>

    <!-- 商品详情快速预览弹层 -->
    <view class="popup-mask" v-if="showQuickView" @click="closeQuickView">
      <view class="popup-content qv-content" @click.stop>
        <view class="qv-header">
          <text class="qv-title">商品详情</text>
          <view class="qv-close" @click="closeQuickView">✕</view>
        </view>
        <scroll-view scroll-y class="qv-body" v-if="!qvLoading && !qvFailed">
          <swiper class="qv-gallery" circular :indicator-dots="qvGallery.length > 1"
            indicator-color="rgba(0,0,0,0.3)" indicator-active-color="#ffffff"
            v-if="qvGallery.length > 0">
            <swiper-item v-for="(img, idx) in qvGallery" :key="idx">
              <image class="qv-gallery-image" :src="img" mode="aspectFill" @click="previewQvImage(idx)" />
            </swiper-item>
          </swiper>
          <view class="qv-gallery qv-gallery-empty" v-else>
            <text class="qv-gallery-placeholder">📦</text>
          </view>
          <view class="qv-info">
            <view class="qv-name">{{ qvGoods.name }}</view>
            <view class="qv-price" v-if="!hidePrice">¥{{ qvGoods.price }}</view>
          </view>
          <view class="qv-detail-card">
            <view class="qv-detail-title">商品详情</view>
            <view class="qv-detail-content" v-if="qvGoods.detail">
              <rich-text :nodes="qvGoods.detail"></rich-text>
            </view>
            <view class="qv-detail-empty" v-else>
              <text>暂无更多详情</text>
            </view>
          </view>
        </scroll-view>
        <view class="qv-state" v-else-if="qvLoading">
          <text>加载中...</text>
        </view>
        <view class="qv-state" v-else-if="qvFailed">
          <text>详情加载失败</text>
        </view>
        <view class="qv-footer">
          <button class="qv-full-btn" @click="goFullDetail">查看完整详情 →</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { getActivityDetail, submitPickup, getArea, getSetting, getGoodsDetail } from '@/api/gift'

const activityId = ref('')
const cardId = ref('')
const activity = ref({})
const goodsList = ref([])
const cardInfo = ref({})
const selectedGoods = ref([])
const showAddressForm = ref(false)
const pageLoading = ref(true)
const submitting = ref(false)
const pickupEnabled = ref(true)

// 商品详情快速预览弹层
const showQuickView = ref(false)
const qvGoods = ref({})
const qvLoading = ref(false)
const qvFailed = ref(false)

const addressForm = ref({
  contact: '',
  mobile: '',
  province: '',
  city: '',
  district: '',
  address: '',
  // 用户下单备注（选填，最多200字）
  remark: ''
})

// ==================== 收货弹窗滚动 / 键盘避让 ====================
// 键盘高度（px）：弹窗是 fixed 定位，不会跟随键盘自动上移，需手动抬高 bottom
const keyboardHeight = ref(0)
// 可视区域高度（px）：H5 用 visualViewport.height，小程序用 windowHeight - 键盘高度
const visibleHeight = ref(0)
const windowHeight = ref(0)
// 表单聚焦时滚动到的锚点（解决键盘弹出后字段被挤出可视区）
const scrollIntoView = ref('')

// 弹窗高度：不超过可视区域的 90%（键盘弹出时同步收缩）
const popupHeight = computed(() => {
  const h = visibleHeight.value || windowHeight.value || 600
  return Math.max(240, Math.round(h * 0.9))
})
const popupMaxHeight = computed(() => popupHeight.value + 'px')

// 表单可滚动区高度：弹窗高度 - 标题/按钮/内边距预留
const formScrollMaxHeight = computed(() => {
  const reserve = 150 // 标题 + 按钮区 + 上下内边距（px）
  return Math.max(120, popupHeight.value - reserve) + 'px'
})

const onKeyboardChange = (res) => {
  const h = Number(res && res.height) || 0
  keyboardHeight.value = h > 0 ? h : 0
  // 小程序：windowHeight 固定，键盘占掉多少就少多少
  const winH = windowHeight.value || 0
  if (winH) visibleHeight.value = Math.max(0, winH - keyboardHeight.value)
}

// 聚焦时把该字段滚到滚动区顶部附近，避免被键盘挡住
const onFieldFocus = (id) => {
  scrollIntoView.value = ''
  nextTick(() => {
    setTimeout(() => { scrollIntoView.value = id }, 60)
  })
}

// #ifdef H5
// H5（含微信内置浏览器）没有 uni.onKeyboardHeightChange，用 visualViewport 推算键盘高度
let h5ViewportBound = false
const h5SyncViewport = () => {
  if (typeof window === 'undefined') return
  const vv = window.visualViewport
  const layoutH = window.innerHeight || 0
  if (!vv) {
    // 无 visualViewport 能力（老内核）：布局视口自身会被键盘压缩，无需额外抬高
    keyboardHeight.value = 0
    visibleHeight.value = layoutH
    return
  }
  // 键盘遮挡高度 = 布局视口高度 - 可视视口高度 - 可视视口偏移
  const kh = Math.max(0, Math.round(layoutH - vv.height - vv.offsetTop))
  keyboardHeight.value = kh > 40 ? kh : 0 // 40px 阈值：过滤地址栏收缩带来的抖动
  visibleHeight.value = Math.round(vv.height)
}
const h5BindViewport = () => {
  if (typeof window === 'undefined') return
  h5SyncViewport()
  const vv = window.visualViewport
  if (vv && !h5ViewportBound) {
    vv.addEventListener('resize', h5SyncViewport)
    vv.addEventListener('scroll', h5SyncViewport)
    h5ViewportBound = true
  }
  window.addEventListener('resize', h5SyncViewport)
}
const h5UnbindViewport = () => {
  if (typeof window === 'undefined') return
  const vv = window.visualViewport
  if (vv && h5ViewportBound) {
    vv.removeEventListener('resize', h5SyncViewport)
    vv.removeEventListener('scroll', h5SyncViewport)
    h5ViewportBound = false
  }
  window.removeEventListener('resize', h5SyncViewport)
}
// 弹窗打开期间锁住页面滚动，避免 iOS 聚焦输入框时整页被顶动导致 fixed 弹窗错位
const h5LockBody = (lock) => {
  if (typeof document === 'undefined' || !document.body) return
  document.body.style.overflow = lock ? 'hidden' : ''
}
// #endif

// 活动收货省份限制（空数组 = 不限）
const areaLimitList = computed(() => {
  const limit = activity.value.area_limit
  return Array.isArray(limit) ? limit : []
})
const areaLimitText = computed(() => areaLimitList.value.join('、'))

// 活动「不显示商品价格」：1 = 隐藏商品价 / 合计金额 / 详情价；下单与金额限制校验照常生效
const hidePrice = computed(() => Number(activity.value.hide_price) === 1)

// 省市区三列联动数据
const multiArray = ref([[], [], []])
const multiIndex = ref([0, 0, 0])
const areaCache = ref({})

// 区域显示文本
const regionDisplayText = computed(() => {
  const p = multiArray.value[0][multiIndex.value[0]]
  const c = multiArray.value[1][multiIndex.value[1]]
  const d = multiArray.value[2][multiIndex.value[2]]
  const parts = []
  if (p && p.id) parts.push(p.name)
  if (c && c.id) parts.push(c.name)
  if (d && d.id) parts.push(d.name)
  return parts.length ? parts.join(' ') : '请选择省市区'
})

// 带缓存的区域加载
const loadArea = async (parentId) => {
  const cacheKey = String(parentId)
  if (areaCache.value[cacheKey]) {
    return areaCache.value[cacheKey]
  }
  try {
    const res = await getArea(parentId)
    if (res.code === 200 && res.data) {
      areaCache.value[cacheKey] = res.data
      return res.data
    }
  } catch (e) {
    console.error('加载区域失败', e)
  }
  return []
}

// 初始化省市区数据
const initRegionPicker = async () => {
  const provinces = await loadArea(0)
  multiArray.value[0] = provinces
  if (provinces.length > 0) {
    const cities = await loadArea(provinces[0].id)
    multiArray.value[1] = cities.length ? cities : [{ id: 0, name: '—' }]
    if (cities.length > 0) {
      const districts = await loadArea(cities[0].id)
      multiArray.value[2] = districts.length ? districts : [{ id: 0, name: '—' }]
    } else {
      multiArray.value[2] = [{ id: 0, name: '—' }]
    }
  }
}

// 三列columnchange事件
const onRegionColumnChange = async (e) => {
  const { column, value } = e.detail
  multiIndex.value[column] = value
  
  if (column === 0) {
    // 省份变更 → 加载城市 → 重置区
    multiIndex.value[1] = 0
    multiIndex.value[2] = 0
    const province = multiArray.value[0][value]
    if (province && province.id) {
      const cities = await loadArea(province.id)
      multiArray.value[1] = cities.length ? cities : [{ id: 0, name: '—' }]
      if (cities.length > 0) {
        const districts = await loadArea(cities[0].id)
        multiArray.value[2] = districts.length ? districts : [{ id: 0, name: '—' }]
      } else {
        multiArray.value[2] = [{ id: 0, name: '—' }]
      }
    } else {
      multiArray.value[1] = [{ id: 0, name: '—' }]
      multiArray.value[2] = [{ id: 0, name: '—' }]
    }
    // uni-app multiSelector needs index update
    multiArray.value = [...multiArray.value]
  }
  
  if (column === 1) {
    // 城市变更 → 加载区县
    multiIndex.value[2] = 0
    const city = multiArray.value[1][value]
    if (city && city.id) {
      const districts = await loadArea(city.id)
      multiArray.value[2] = districts.length ? districts : [{ id: 0, name: '—' }]
    } else {
      multiArray.value[2] = [{ id: 0, name: '—' }]
    }
    multiArray.value = [...multiArray.value]
  }
}

// 获取已选商品数量
const getQuantity = (goodsId) => {
  const item = selectedGoods.value.find(g => g.goods_id === goodsId)
  return item ? item.quantity : 0
}

// 计算总金额
const totalAmount = computed(() => {
  let total = 0
  selectedGoods.value.forEach(item => {
    const goods = goodsList.value.find(g => g.id === item.goods_id)
    if (goods) {
      total += goods.price * item.quantity
    }
  })
  return total.toFixed(2)
})

// 已选商品总件数：活动隐藏价格时替代合计金额展示
const totalQuantity = computed(() =>
  selectedGoods.value.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
)

// 查看商品详情（页内弹层快速预览，不离开兑换页）
const openQuickView = async (goods) => {
  showQuickView.value = true
  qvLoading.value = true
  qvFailed.value = false
  qvGoods.value = { id: goods.id }
  try {
    const res = await getGoodsDetail(goods.id, activityId.value)
    if (res.code === 200 && res.data) {
      qvGoods.value = res.data
    } else {
      qvFailed.value = true
    }
  } catch (e) {
    qvFailed.value = true
  } finally {
    qvLoading.value = false
  }
}

// 关闭快速预览弹层
const closeQuickView = () => {
  showQuickView.value = false
}

// 前往完整商品详情页
const goFullDetail = () => {
  const id = qvGoods.value.id
  closeQuickView()
  if (id) {
    // 带上活动ID：商品详情页据此向后端查询 hide_price，决定是否隐藏价格
    const activityParam = activityId.value ? '&activity_id=' + encodeURIComponent(activityId.value) : ''
    uni.navigateTo({ url: '/pages/gift/goods-detail/index?id=' + id + activityParam })
  }
}

// 预览详情图集
const previewQvImage = (index) => {
  const urls = qvGallery.value
  if (!urls.length) return
  uni.previewImage({ urls, current: index })
}

// 详情图集（无图集时用封面兜底）
const qvGallery = computed(() => {
  const images = Array.isArray(qvGoods.value.images) ? qvGoods.value.images : []
  if (images.length === 0 && qvGoods.value.cover) {
    return [qvGoods.value.cover]
  }
  return images
})

// 数量操作
const handleQuantity = (goods, delta) => {
  const index = selectedGoods.value.findIndex(g => g.goods_id === goods.id)
  if (index === -1) {
    if (delta > 0) {
      // 数量+时自动选中商品
      if (activity.value.exchange_mode === 1) {
        if (selectedGoods.value.length >= (activity.value.max_category || 3)) {
          uni.showToast({ title: `最多选择${activity.value.max_category || 3}种商品`, icon: 'none' })
          return
        }
      }
      selectedGoods.value.push({ goods_id: goods.id, quantity: 1 })
    }
    // delta < 0 但商品不在列表中，忽略
    return
  }
  
  const newQty = selectedGoods.value[index].quantity + delta
  if (newQty <= 0) {
    selectedGoods.value.splice(index, 1)
  } else {
    // 验证数量限制
    if (activity.value.exchange_mode === 1 && newQty > (activity.value.max_quantity || 5)) {
      uni.showToast({ title: `单种商品最多${activity.value.max_quantity || 5}件`, icon: 'none' })
      return
    }
    // 验证金额限制
    if (activity.value.exchange_mode === 2) {
      let total = 0
      selectedGoods.value.forEach((item, i) => {
        const g = goodsList.value.find(g => g.id === item.goods_id)
        if (g) {
          total += g.price * (i === index ? newQty : item.quantity)
        }
      })
      if (total > (activity.value.max_amount || 0)) {
        uni.showToast({ title: `超出金额限制¥${activity.value.max_amount}`, icon: 'none' })
        return
      }
    }
    selectedGoods.value[index].quantity = newQty
  }
}

// 输入数量
const handleInput = (e, goods) => {
  const quantity = parseInt(e.detail.value) || 0
  const index = selectedGoods.value.findIndex(g => g.goods_id === goods.id)
  
  if (quantity <= 0) {
    if (index !== -1) {
      selectedGoods.value.splice(index, 1)
    }
  } else {
    if (activity.value.exchange_mode === 1 && quantity > (activity.value.max_quantity || 5)) {
      uni.showToast({ title: `单种商品最多${activity.value.max_quantity || 5}件`, icon: 'none' })
      return
    }
    
    if (index === -1) {
      if (activity.value.exchange_mode === 1 && selectedGoods.value.length >= (activity.value.max_category || 3)) {
        uni.showToast({ title: `最多选择${activity.value.max_category || 3}种商品`, icon: 'none' })
        return
      }
      selectedGoods.value.push({ goods_id: goods.id, quantity })
    } else {
      selectedGoods.value[index].quantity = quantity
    }
  }
}

// 手机号校验
const isValidMobile = (mobile) => /^1[3-9]\d{9}$/.test(mobile)

// 提交预约
const handleSubmit = () => {
  if (!pickupEnabled.value) {
    uni.showToast({ title: '提货功能已暂停', icon: 'none' })
    return
  }
  if (selectedGoods.value.length === 0) {
    uni.showToast({ title: '请选择商品', icon: 'none' })
    return
  }
  showAddressForm.value = true
  keyboardHeight.value = 0
  scrollIntoView.value = ''
  initRegionPicker()
  // #ifdef H5
  h5BindViewport()
  h5LockBody(true)
  // #endif
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 关闭地址表单
const closeAddress = () => {
  showAddressForm.value = false
  keyboardHeight.value = 0
  scrollIntoView.value = ''
  // #ifdef H5
  h5LockBody(false)
  // #endif
  // 收起键盘，避免下次打开弹窗时被残留的键盘高度影响
  if (typeof uni.hideKeyboard === 'function') uni.hideKeyboard()
}

// 确认预约
const handleConfirm = async () => {
  if (submitting.value) return
  // 收起键盘，避免输入框失焦/键盘遮挡导致的弹窗位置错乱
  if (typeof uni.hideKeyboard === 'function') uni.hideKeyboard()
  
  if (!addressForm.value.contact) {
    uni.showToast({ title: '请输入联系人', icon: 'none' })
    return
  }
  if (!addressForm.value.mobile) {
    uni.showToast({ title: '请输入手机号码', icon: 'none' })
    return
  }
  if (!isValidMobile(addressForm.value.mobile)) {
    uni.showToast({ title: '请输入正确的手机号码', icon: 'none' })
    return
  }
  if (!addressForm.value.address) {
    uni.showToast({ title: '请输入详细地址', icon: 'none' })
    return
  }
  
  // 从三列选择器中提取省市区
  addressForm.value.province = multiArray.value[0][multiIndex.value[0]]?.name || ''
  addressForm.value.city = multiArray.value[1][multiIndex.value[1]]?.name || ''
  addressForm.value.district = multiArray.value[2][multiIndex.value[2]]?.name || ''

  // 收货省份限制校验（后端也会校验，这里前置拦截提升体验）
  if (areaLimitList.value.length > 0) {
    const province = addressForm.value.province
    if (!province || !areaLimitList.value.includes(province)) {
      uni.showToast({
        title: `该活动仅支持：${areaLimitText.value} 收货`,
        icon: 'none',
        duration: 2500
      })
      return
    }
  }

  // 备注去空格（trim），空值传空字符串
  const payloadRemark = (addressForm.value.remark || '').trim()
  submitting.value = true
  try {
    const res = await submitPickup({
      card_id: cardInfo.value.id,
      goods: selectedGoods.value,
      contact: addressForm.value.contact,
      mobile: addressForm.value.mobile,
      province: addressForm.value.province,
      city: addressForm.value.city,
      district: addressForm.value.district,
      address: addressForm.value.address,
      remark: payloadRemark
    })
    
    if (res.code === 200) {
      uni.showToast({ title: '✓ 预约成功', icon: 'none' })
      // 存储卡号密码，切换 tab 后 query 页自动查询
      uni.setStorageSync('query_card_no', cardInfo.value.card_no)
      uni.setStorageSync('query_card_pwd', cardInfo.value.card_pwd)
      uni.setStorageSync('auto_query', true)
      setTimeout(() => {
        uni.switchTab({ url: '/pages/gift/query/index' })
      }, 1500)
    } else {
      uni.showToast({ title: res.msg || '预约失败', icon: 'none' })
    }
  } catch (error) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// 加载活动详情
const loadData = async () => {
  pageLoading.value = true
  try {
    const res = await getActivityDetail(activityId.value, cardId.value)
    if (res.code === 200) {
      activity.value = res.data.activity || {}
      goodsList.value = res.data.goods || []
      if (res.data.card) {
        cardInfo.value = res.data.card
      }
    } else {
      uni.showToast({ title: res.msg || '加载失败', icon: 'none', duration: 2000 })
      setTimeout(() => { uni.navigateBack() }, 2000)
    }
  } catch (error) {
    console.error('加载失败', error)
    uni.showToast({ title: '网络错误，请稍后重试', icon: 'none', duration: 2000 })
    setTimeout(() => { uni.navigateBack() }, 2000)
  } finally {
    pageLoading.value = false
  }
}

// 加载提货设置
const loadSetting = async () => {
  try {
    const res = await getSetting()
    if (res.code === 200 && res.data) {
      pickupEnabled.value = res.data.is_enable !== 0
    }
  } catch (e) {
    console.error('加载提货设置失败', e)
  }
}

onLoad((options) => {
  activityId.value = options.id || ''
  cardId.value = options.card_id || ''
  // 有 card_id 时验证卡密后加载，无 card_id 时直接加载活动详情
  loadData()
  loadSetting()

  // 收货弹窗：记录窗口高度 + 监听键盘高度（H5/部分平台无此 API，做兼容判断）
  try {
    const sysInfo = uni.getSystemInfoSync()
    windowHeight.value = sysInfo.windowHeight || 0
  } catch (e) {
    windowHeight.value = 600
  }
  // #ifdef H5
  // H5 用布局视口高度做基准，键盘高度由 visualViewport 推算
  if (typeof window !== 'undefined' && window.innerHeight) {
    windowHeight.value = window.innerHeight
  }
  visibleHeight.value = windowHeight.value
  h5BindViewport()
  // #endif
  // #ifndef H5
  visibleHeight.value = windowHeight.value
  if (typeof uni.onKeyboardHeightChange === 'function') {
    uni.onKeyboardHeightChange(onKeyboardChange)
  }
  // #endif
})

onUnload(() => {
  // #ifdef H5
  h5UnbindViewport()
  h5LockBody(false)
  // #endif
  // #ifndef H5
  if (typeof uni.offKeyboardHeightChange === 'function') {
    uni.offKeyboardHeightChange(onKeyboardChange)
  }
  // #endif
  keyboardHeight.value = 0
})
</script>

<style scoped>
.activity-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.cover-box {
  position: relative;
  height: 400rpx;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 120rpx;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
}

.activity-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}

.activity-time {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
}

.back-btn {
  position: absolute;
  top: 0;
  left: 20rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  border-radius: 50%;
  z-index: 3;
}

.back-icon {
  font-size: 48rpx;
  color: #fff;
  font-weight: 300;
  line-height: 1;
  margin-left: -4rpx;
}

.rule-box {
  background: #fff;
  margin: 20rpx;
  border-radius: 15rpx;
  padding: 25rpx;
}

.rule-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 15rpx;
}

.rule-item {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
  font-size: 26rpx;
  color: #666;
}

.rule-icon {
  margin-right: 10rpx;
}

.goods-box {
  background: #fff;
  margin: 20rpx;
  border-radius: 15rpx;
  padding: 25rpx;
}

.goods-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.goods-count {
  font-size: 24rpx;
  color: #999;
  font-weight: normal;
}

.goods-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.goods-item {
  width: calc(50% - 10rpx);
  background: #f9f9f9;
  border-radius: 10rpx;
  overflow: hidden;
}

.goods-cover {
  position: relative;
  height: 200rpx;
  background: #eee;
}

.goods-cover image {
  width: 100%;
  height: 100%;
}

.goods-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
}

.goods-stock {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 20rpx;
  text-align: center;
  padding: 8rpx;
}

.goods-info {
  padding: 15rpx;
}

.goods-name {
  font-size: 26rpx;
  color: #333;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-price {
  font-size: 28rpx;
  color: #f53f3f;
  font-weight: bold;
}

.goods-action {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15rpx;
  border-top: 1rpx solid #eee;
}

.quantity-control {
  width: 50rpx;
  height: 50rpx;
  background: #fff;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.quantity-input {
  width: 80rpx;
  height: 50rpx;
  background: #fff;
  border: 1rpx solid #ddd;
  margin: 0 10rpx;
  text-align: center;
  font-size: 26rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
}

.total-info {
  flex: 1;
}

.total-label {
  font-size: 26rpx;
  color: #666;
}

.total-value {
  font-size: 36rpx;
  color: #f53f3f;
  font-weight: bold;
}

.btn-submit {
  width: 240rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 28rpx;
  line-height: 88rpx;
  padding: 0;
  border: none;
  margin: 0;
}
/* 覆盖 uniapp button 默认样式 */
.btn-submit::after {
  border: none;
}
/* 覆盖 H5 端 button 默认背景 */
.btn-submit[type] {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-submit.disabled,
.btn-submit[disabled] {
  background: #c0c0c0 !important;
  color: #fff;
}

/* 弹窗遮罩 */
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}
.popup-content {
  width: 100%;
}

/* 收货信息弹窗：底部弹出，表单区独立滚动，按钮固定在底部 */
.address-popup {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: #fff;
  border-radius: 30rpx 30rpx 0 0;
  padding: 40rpx 40rpx 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
  transition: bottom 0.18s ease;
}

/* 表单滚动区（高度由 JS 按可视区域与键盘高度计算） */
.form-scroll {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.form-title {
  font-size: 32rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 0 60rpx 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.input-clear {
  position: absolute;
  right: 0;
  top: 0;
  width: 60rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #999;
  z-index: 2;
}

.textarea-clear {
  top: 10rpx;
  height: auto;
}

.form-picker-row {
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 0 20rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  color: #333;
}

.form-textarea {
  width: 100%;
  height: 150rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

/* 备注输入框（较矮） */
.form-textarea-remark {
  height: 100rpx;
}

/* #ifdef H5 */
/* iOS 微信/Safari 下输入框字号 < 16px 会在聚焦时自动放大整页，导致弹窗与键盘错位 */
.form-input,
.form-textarea {
  font-size: 16px !important;
}
/* #endif */

.form-label-sub {
  font-size: 22rpx;
  color: #999;
  font-weight: normal;
}

.form-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
  padding: 20rpx 0 40rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  background: #fff;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 28rpx;
  border: none;
  line-height: 88rpx;
  padding: 0;
  text-align: center;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.goods-loading, .goods-empty {
  padding: 80rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #999;
}

/* 商品卡内查看详情入口 */
.goods-detail-link {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #667eea;
}

/* 商品详情快速预览弹层 */
.qv-content {
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  border-radius: 30rpx 30rpx 0 0;
  background: #fff;
}

.qv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 40rpx 20rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.qv-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1d2129;
}

.qv-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #86909c;
}

.qv-body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 32rpx 0;
}

.qv-gallery {
  width: 100%;
  height: 480rpx;
  border-radius: 16rpx;
  background: #f5f5f5;
  overflow: hidden;
}

.qv-gallery-image {
  width: 100%;
  height: 100%;
}

.qv-gallery-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qv-gallery-placeholder {
  font-size: 120rpx;
  opacity: 0.4;
}

.qv-info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 24rpx 0;
}

.qv-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1d2129;
}

.qv-price {
  font-size: 36rpx;
  font-weight: 700;
  color: #e53e30;
}

.qv-detail-card {
  padding-bottom: 20rpx;
}

.qv-detail-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.qv-detail-content {
  font-size: 28rpx;
  color: #4e5969;
  line-height: 1.7;
  word-break: break-all;
}

.qv-detail-content :deep(img),
.qv-detail-content :deep(image) {
  max-width: 100% !important;
  height: auto !important;
}

.qv-detail-empty {
  padding: 30rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #c9cdd4;
}

.qv-state {
  padding: 120rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #86909c;
}

.qv-footer {
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f1f3;
}

.qv-full-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 28rpx;
  line-height: 88rpx;
  padding: 0;
  border: none;
}

.qv-full-btn::after {
  border: none;
}
</style>
