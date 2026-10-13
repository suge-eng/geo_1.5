<template>
  <div class="login-page">
    <!-- 背景悬浮几何体装饰 -->
    <div class="bg-shape shape-1" />
    <div class="bg-shape shape-2" />
    <div class="bg-shape shape-3" />
    <div class="bg-shape shape-4" />

    <!-- Toast 提示 -->
    <div
      class="toast"
      :class="[toast.type, { show: toast.show }]"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
      >
        <path
          v-if="toast.type === 'success'"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        />
        <path
          v-else
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
        />
      </svg>
      <span>{{ toast.message }}</span>
    </div>

    <!-- 登录卡片 -->
    <div class="login-wrapper">
      <!-- 左侧插画区 -->
      <div class="illustration-side">
        <svg
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="buildingGrad1"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stop-color="#a5c4ff"
              />
              <stop
                offset="100%"
                stop-color="#7a9cff"
              />
            </linearGradient>
            <linearGradient
              id="buildingGrad2"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stop-color="#8ab4ff"
              />
              <stop
                offset="100%"
                stop-color="#5b8ff9"
              />
            </linearGradient>
            <linearGradient
              id="baseGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stop-color="#eef3ff"
              />
              <stop
                offset="100%"
                stop-color="#dce6ff"
              />
            </linearGradient>
            <linearGradient
              id="screenGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stop-color="#ffffff"
              />
              <stop
                offset="100%"
                stop-color="#f0f4ff"
              />
            </linearGradient>
            <filter
              id="shadow"
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
            >
              <feDropShadow
                dx="0"
                dy="8"
                stdDeviation="6"
                flood-color="#4a6ef8"
                flood-opacity="0.15"
              />
            </filter>
          </defs>

          <!-- 地面底座 (等距视角) -->
          <path
            d="M 200 320 L 80 260 L 200 200 L 320 260 Z"
            fill="url(#baseGrad)"
            filter="url(#shadow)"
          />
          <path
            d="M 200 340 L 80 280 L 200 220 L 320 280 Z"
            fill="#ffffff"
            opacity="0.6"
          />

          <!-- 左侧高楼 -->
          <path
            d="M 110 240 L 110 130 L 150 110 L 150 220 Z"
            fill="url(#buildingGrad1)"
          />
          <path
            d="M 110 130 L 130 120 L 170 140 L 150 110 Z"
            fill="#cbd9ff"
          />
          <path
            d="M 150 110 L 150 220 L 170 230 L 170 140 Z"
            fill="url(#buildingGrad2)"
          />

          <!-- 右侧主楼 -->
          <path
            d="M 140 220 L 140 90 L 190 70 L 190 200 Z"
            fill="#e0e8ff"
          />
          <path
            d="M 140 90 L 165 80 L 215 100 L 190 70 Z"
            fill="#ffffff"
          />
          <path
            d="M 190 70 L 190 200 L 215 210 L 215 100 Z"
            fill="url(#buildingGrad1)"
          />
          <rect
            x="150"
            y="110"
            width="6"
            height="20"
            fill="#a5c4ff"
            opacity="0.6"
          />
          <rect
            x="150"
            y="150"
            width="6"
            height="20"
            fill="#a5c4ff"
            opacity="0.6"
          />
          <rect
            x="175"
            y="100"
            width="6"
            height="20"
            fill="#a5c4ff"
            opacity="0.6"
          />
          <rect
            x="175"
            y="140"
            width="6"
            height="20"
            fill="#a5c4ff"
            opacity="0.6"
          />

          <!-- 数据展示屏幕/面板 -->
          <g transform="translate(130, 190)">
            <path
              d="M 0 40 L 80 0 L 160 40 L 80 80 Z"
              fill="url(#screenGrad)"
              filter="url(#shadow)"
            />
            <path
              d="M 10 40 L 80 5 L 150 40 L 80 75 Z"
              fill="#ffffff"
              stroke="#e0e8ff"
              stroke-width="1"
            />
            <circle
              cx="50"
              cy="35"
              r="10"
              fill="none"
              stroke="#5b8ff9"
              stroke-width="3"
              opacity="0.8"
            />
            <circle
              cx="50"
              cy="35"
              r="10"
              fill="none"
              stroke="#a5c4ff"
              stroke-width="3"
              stroke-dasharray="20 40"
            />
            <rect
              x="80"
              y="25"
              width="40"
              height="6"
              rx="3"
              fill="#e0e8ff"
            />
            <rect
              x="80"
              y="35"
              width="60"
              height="4"
              rx="2"
              fill="#f0f4ff"
            />
            <rect
              x="80"
              y="43"
              width="50"
              height="4"
              rx="2"
              fill="#f0f4ff"
            />
          </g>

          <!-- 定位 Pin -->
          <g transform="translate(220, 150)">
            <path
              d="M 20 0 C 9 0 0 9 0 20 C 0 35 20 50 20 50 C 20 50 40 35 40 20 C 40 9 31 0 20 0 Z"
              fill="#3e7bfa"
              filter="url(#shadow)"
            />
            <circle
              cx="20"
              cy="20"
              r="7"
              fill="#ffffff"
            />
          </g>

          <!-- 人物简影 -->
          <g transform="translate(180, 230)">
            <path
              d="M 10 30 Q 10 15 20 15 Q 30 15 30 30 L 35 60 L 25 60 L 20 45 L 15 60 L 5 60 Z"
              fill="#2f46e5"
            />
            <circle
              cx="20"
              cy="8"
              r="8"
              fill="#1a2b4c"
            />
            <path
              d="M 10 30 L -5 40 L -2 45 L 12 35 Z"
              fill="#2f46e5"
            />
            <path
              d="M 12 60 L 10 75 L 15 75 L 18 60 Z"
              fill="#1a2b4c"
            />
            <path
              d="M 28 60 L 30 75 L 25 75 L 22 60 Z"
              fill="#1a2b4c"
            />
          </g>

          <!-- 绿植 -->
          <g transform="translate(150, 280)">
            <path
              d="M 10 20 L 10 10 Q 10 0 20 0 Q 30 0 30 10 Q 30 20 20 20 Z"
              fill="#4ade80"
            />
            <path
              d="M 20 20 L 20 35 L 15 40 L 25 40 Z"
              fill="#ffffff"
              opacity="0.8"
            />
          </g>
        </svg>
      </div>

      <!-- 右侧表单区 -->
      <div class="form-side">
        <div class="logo-area">
          <h1
            class="scifi-title"
            data-text="GEO系统登录"
          >
            GEO系统登录
          </h1>
        </div>

        <!-- <form @submit.prevent="onSubmit"> -->
        <!-- 账号输入框 -->
        <el-input
          v-model="username"
          placeholder="账号"
          :prefix-icon="User"
          @keyup.enter="focusPassword"
          class="custom-input"
        />
        
        <!-- 密码输入框 -->
        <el-input
          ref="passwordInputRef"
          v-model="password"
          type="password"
          placeholder="密码"
          :prefix-icon="Lock"
          show-password
          @keyup.enter.prevent="onSubmit"
          class="custom-input"
        />

        <button
          type="button"
          class="login-btn"
          :disabled="loading"
          @click="onSubmit"
        >
          {{ loading ? '登录中…' : '登 录' }}
        </button>
      <!-- </form> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Lock } from '@element-plus/icons-vue'
import { ElInput } from 'element-plus'
import { reactive, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login as apiLogin } from '@/api/auth'
import { MOCK_LOGIN_USERS } from '@/mock'
import { USE_MOCK } from '@/mock/flag'
import { useAuthStore } from '@/store/auth'
import { PROJECT_LIST_PATH } from '@/utils/projectPath'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

const passwordInputRef = ref<InstanceType<typeof ElInput> | null>(null)

const toast = reactive({
  show: false,
  type: 'success' as 'success' | 'error',
  message: ''
})

let toastTimer: ReturnType<typeof setTimeout> | null = null

// 账号按回车后，聚焦到密码输入框
function focusPassword() {
  nextTick(() => {
    // Element Plus 组件暴露了 focus 方法，直接调用即可
    passwordInputRef.value?.focus()
  })
}

/** 对齐原型 登录.html 的 Toast：成功后 3 秒自动隐藏 */
function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.message = message
  toast.type = type
  toast.show = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.show = false
  }, 3000)
}

/** 登录成功后的统一落库 + 跳转：默认进项目列表，选了项目再进业务页 */
function enterSystem(token: string, nickname: string) {
  authStore.login(token, { nickname })
  const redirect = (route.query.redirect as string) || PROJECT_LIST_PATH
  router.push(redirect)
}

async function onSubmit() {
  const u = username.value.trim()
  const p = password.value.trim()

  if (!u || !p) {
    showToast('请输入账号和密码', 'error')
    return
  }

  loading.value = true
  try {
    if (USE_MOCK) {
      // 虚拟登录：按 mock/index.ts 的账号表校验
      const hit = MOCK_LOGIN_USERS.find(m => m.username === u && m.password === p)
      if (hit) {
        showToast('登录成功！正在进入系统...', 'success')
        // 模拟跳转延迟，与原型一致
        await new Promise(resolve => setTimeout(resolve, 1000))
        enterSystem(`mock-token-${hit.username}-${Date.now()}`, hit.nickname)
      } else {
        showToast('账号或密码错误，请重新输入', 'error')
      }
    } else {
      // 后端当前无鉴权体系（见 docs/后端API分析报告.md），
      // 不调用 /api/auth/login，直接放行进入系统，token 由前端本地生成。
      // 后端补齐 JWT 后，把这里换回 apiLogin({ username: u, password: p }) 即可。
      showToast('登录成功！正在进入系统...', 'success')
      await new Promise(resolve => setTimeout(resolve, 500))
      enterSystem(`local-token-${u}-${Date.now()}`, u || '管理员')
    }
  } catch {
    // 真实接口失败时 axios 拦截器已提示具体原因，这里补一层本地 Toast 兜底
    showToast('登录失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
/* 配色与尺寸对齐原型 登录.html */
.login-page {
  --lg-primary-blue: #4a6ef8;
  --lg-primary-dark: #2f46e5;
  --lg-btn-gradient: linear-gradient(90deg, #5b8ff9 0%, #3e7bfa 100%);
  --lg-text-main: #333333;
  --lg-text-sub: #999999;
  --lg-border-color: #e8e8e8;

  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #4a6ef8 0%, #2f46e5 100%);
  overflow: hidden;
  position: relative;

  /* 背景悬浮几何体装饰 */
  .bg-shape {
    position: absolute;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(5px);
    border-radius: 4px;
    z-index: 1;
  }

  .shape-1 {
    width: 60px;
    height: 150px;
    top: 10%;
    left: 15%;
    transform: skewY(-20deg);
  }

  .shape-2 {
    width: 80px;
    height: 200px;
    bottom: 10%;
    right: 10%;
    transform: skewY(-20deg);
  }

  .shape-3 {
    width: 40px;
    height: 100px;
    top: 60%;
    left: 5%;
    transform: skewY(-20deg);
  }

  .shape-4 {
    width: 50px;
    height: 120px;
    top: 20%;
    right: 25%;
    transform: skewY(-20deg);
  }

  /* 登录卡片主容器 */
  .login-wrapper {
    width: 960px;
    height: 560px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
    display: flex;
    z-index: 10;
    overflow: hidden;
  }

  /* 左侧插画区 */
  .illustration-side {
    flex: 1.1;
    background: #fafbff;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    border-right: 1px solid rgba(0, 0, 0, 0.03);

    svg {
      width: 90%;
      height: 90%;
      animation: float 6s ease-in-out infinite;
    }
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }

    50% {
      transform: translateY(-10px);
    }
  }

  /* 右侧表单区 */
  .form-side {
    flex: 0.9;
    padding: 60px 70px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .logo-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 50px;
  }

  /* 基础科幻渐变大标题 */
  .scifi-title {
    user-select: none;
    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 4px;

    background: linear-gradient(135deg, #3b5aff 0%, #00d2ff 50%, #3b5aff 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;

    filter: drop-shadow(0 4px 10px rgba(59, 90, 255, 0.3));
    animation: shine 3s linear infinite;
    position: relative;
    display: inline-block;
  }

  @keyframes shine {
    to {
      background-position: 200% center;
    }
  }

  .scifi-title::before,
  .scifi-title::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 20px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00d2ff);
    transform: translateY(-50%);
    opacity: 0.6;
  }

  .scifi-title::before {
    left: -30px;
  }

  .scifi-title::after {
    right: -30px;
    background: linear-gradient(-90deg, transparent, #00d2ff);
  }

  .logo-area:hover .scifi-title {
    filter: drop-shadow(0 4px 12px rgba(0, 210, 255, 0.6));
    transform: scale(1.02);
    transition: all 0.3s ease;
  }

  /* 覆盖 Element Plus 默认样式，实现下划线风格 */
  .custom-input {
    margin-bottom: 35px;

    :deep(.el-input__wrapper) {
      background-color: transparent !important;
      box-shadow: none !important; /* 去除默认边框和阴影 */
      border-bottom: 1px solid var(--lg-border-color);
      border-radius: 0;
      padding-left: 0; /* 让左侧图标贴边 */
      padding-right: 0; /* 让右侧眼睛贴边 */
      transition: border-color 0.3s;

      /* 聚焦时的下划线变色 */
      &.is-focus {
        border-bottom-color: var(--lg-primary-blue);
      }
    }

    /* 左侧图标颜色和大小 */
    :deep(.el-input__prefix) {
      color: #b0b0b0;
      font-size: 18px;
      transition: color 0.3s;
    }

    /* 聚焦时左侧图标变色 */
    :deep(.el-input__wrapper.is-focus .el-input__prefix) {
      color: var(--lg-primary-blue);
    }

    /* 右侧眼睛图标样式调整 */
    :deep(.el-input__suffix) {
      color: #c0c4cc;
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: var(--lg-primary-blue);
      }
    }

    /* 输入文字样式 */
    :deep(.el-input__inner) {
      height: 40px;
      color: var(--lg-text-main);

      &::placeholder {
        color: #c0c4cc;
      }
    }
  }

  /* 登录按钮 */
  .login-btn {
    width: 100%;
    padding: 12px 0;
    margin-top: 10px;
    border: none;
    border-radius: 25px;
    background: var(--lg-btn-gradient);
    color: #ffffff;
    font-size: 16px;
    letter-spacing: 4px;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(62, 123, 250, 0.3);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(62, 123, 250, 0.4);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 4px 12px rgba(62, 123, 250, 0.3);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.7;
      transform: none;
    }
  }

  /* 现代感 Toast 提示 */
  .toast {
    position: fixed;
    top: 40px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 14px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    color: var(--lg-text-main);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 1000;

    &.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    &.success svg {
      fill: #52c41a;
    }

    &.error svg {
      fill: #ff4d4f;
    }
  }

  /* 响应式适配 */
  @media (max-width: 900px) {
    .login-wrapper {
      width: 90%;
      height: auto;
      flex-direction: column;
    }

    .illustration-side {
      display: none;
    }

    .form-side {
      padding: 40px 30px;
    }
  }
}
</style>
