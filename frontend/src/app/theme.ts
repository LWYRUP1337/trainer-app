import { theme as antdTheme, type ThemeConfig } from 'antd'


const ink = '#1b1647'
const glass = 'rgba(255, 255, 255, 0.08)'
const line = 'rgba(255, 255, 255, 0.16)'

export const theme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: '#b9b4ff',
    colorInfo: '#b9b4ff',
    colorSuccess: '#6fe3b0',
    colorWarning: '#ffc46b',
    colorError: '#ff8590',
    colorLink: '#cfcaff',
    colorLinkHover: '#ffffff',

    colorTextLightSolid: ink,

    colorBgLayout: 'transparent',
    colorBgContainer: glass,
    colorBgElevated: '#272070',
    colorText: '#ffffff',
    colorTextHeading: '#ffffff',
    colorTextSecondary: 'rgba(255, 255, 255, 0.72)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.55)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.4)',
    colorTextDisabled: 'rgba(255, 255, 255, 0.4)',
    colorTextPlaceholder: 'rgba(255, 255, 255, 0.5)',
    colorBorder: 'rgba(255, 255, 255, 0.24)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.14)',
    colorSplit: 'rgba(255, 255, 255, 0.12)',

    borderRadius: 12,
    borderRadiusLG: 16,
    controlHeight: 36,
    fontSize: 15,
    fontFamily: '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      bodyBg: 'transparent',
      headerBg: 'rgba(255, 255, 255, 0.06)',
      siderBg: 'transparent',
      zeroTriggerBg: 'rgba(255, 255, 255, 0.25)',
      zeroTriggerColor: '#ffffff',
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemColor: 'rgba(255, 255, 255, 0.82)',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.14)',
      darkItemHoverColor: '#ffffff',
      darkItemSelectedBg: '#ffffff',
      darkItemSelectedColor: ink,
      itemBorderRadius: 12,
      itemHeight: 46,
    },
    Button: {
      colorPrimary: '#ffffff',
      colorPrimaryHover: '#ebe9ff',
      colorPrimaryActive: '#d8d4ff',
      primaryColor: ink,
      primaryShadow: 'none',
      defaultBg: 'rgba(255, 255, 255, 0.1)',
      defaultColor: '#ffffff',
      defaultBorderColor: 'rgba(255, 255, 255, 0.3)',
      defaultHoverBg: 'rgba(255, 255, 255, 0.2)',
      defaultHoverColor: '#ffffff',
      defaultHoverBorderColor: '#ffffff',
      defaultActiveBg: 'rgba(255, 255, 255, 0.28)',
      defaultActiveColor: '#ffffff',
      defaultActiveBorderColor: '#ffffff',
      defaultShadow: 'none',
    },
    Card: { headerBg: 'transparent', headerFontSize: 17 },
    Table: {
      colorBgContainer: 'transparent',
      headerBg: 'rgba(255, 255, 255, 0.07)',
      headerColor: 'rgba(255, 255, 255, 0.88)',
      headerSplitColor: 'transparent',
      rowHoverBg: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    Segmented: {
      trackBg: 'rgba(255, 255, 255, 0.12)',
      itemColor: 'rgba(255, 255, 255, 0.85)',
      itemHoverColor: '#ffffff',
      itemHoverBg: 'rgba(255, 255, 255, 0.12)',
      itemSelectedBg: '#ffffff',
      itemSelectedColor: ink,
    },
    Tabs: {
      itemColor: 'rgba(255, 255, 255, 0.65)',
      itemHoverColor: '#ffffff',
      itemSelectedColor: '#ffffff',
      itemActiveColor: '#ffffff',
      inkBarColor: '#ffffff',
    },
    Calendar: {
      fullBg: 'transparent',
      fullPanelBg: 'transparent',
      itemActiveBg: 'rgba(255, 255, 255, 0.16)',
    },
    Descriptions: { labelBg: 'rgba(255, 255, 255, 0.07)' },
    Modal: { contentBg: '#272070', headerBg: '#272070' },
    Tooltip: { colorTextLightSolid: '#ffffff' }, 
  },
}

export const glassLine = line
