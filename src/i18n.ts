import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: {
    enter: 'Enter the experience', start: 'Start customizing', customize: 'Customize', cases: 'Cases', community: 'Community', mine: 'Mine',
    homeEyebrow: 'A room that moves with you', homeTitle: 'Build your own indoor wild place.', homeBody: 'Scan the space, find a frame, then shape it around the way you climb, rest and play.',
    roomTitle: 'Map your room', roomBody: 'Add one clear room photo and confirm the usable dimensions.', upload: 'Choose room photo', camera: 'Use camera', length: 'Length', width: 'Width', height: 'Height', analyze: 'Find my frame',
    resultsTitle: 'Your best matches', compare: 'Compare frames', configure: 'Customize this frame', specs: 'View specifications', review: 'Review design', save: 'Save design', download: 'Download PDF',
    comingSoon: 'Community is opening soon.', saved: 'Design saved', noDesigns: 'No saved designs yet.', language: 'Language', back: 'Back', next: 'Next', undo: 'Undo', reset: 'Reset view', selected: 'Selected', add: 'Add module', remove: 'Remove', submit: 'Submit mock inquiry', submitted: 'Inquiry recorded locally', captureRoom: 'Capture room', cameraReady: 'Camera ready · move slowly to frame the usable area',
  } },
  zh: { translation: {
    enter: '进入体验', start: '开始定制', customize: '定制', cases: '案例', community: '社区', mine: '我的',
    homeEyebrow: '让房间随你一起生长', homeTitle: '在家里，搭建一片属于你的野趣空间。', homeBody: '记录房间、匹配骨架，再按照攀爬、休息与玩耍的方式自由组合。',
    roomTitle: '记录你的房间', roomBody: '添加一张清晰照片，并确认可用空间尺寸。', upload: '选择房间照片', camera: '使用相机', length: '长度', width: '宽度', height: '高度', analyze: '为我推荐骨架',
    resultsTitle: '最适合你的方案', compare: '对比骨架', configure: '定制此骨架', specs: '查看规格', review: '确认方案', save: '保存方案', download: '下载 PDF',
    comingSoon: '社区即将开放。', saved: '方案已保存', noDesigns: '还没有保存的方案。', language: '语言', back: '返回', next: '下一步', undo: '撤销', reset: '重置视角', selected: '已选择', add: '添加模块', remove: '移除', submit: '模拟提交询价', submitted: '询价已记录在本机', captureRoom: '拍摄房间', cameraReady: '相机已就绪 · 缓慢移动并框选可用空间',
  } },
}

i18n.use(initReactI18next).init({ resources, lng: localStorage.getItem('wp-language') || 'en', fallbackLng: 'en', interpolation: { escapeValue: false } })
export default i18n
