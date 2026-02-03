import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdatePrompt.module.css';

export const UpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => setNeedRefresh(false);

  if (!needRefresh) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.prompt}>
        <p className={styles.message}>新しいバージョンが利用可能です</p>
        <div className={styles.buttons}>
          <button
            className={styles.updateButton}
            onClick={() => updateServiceWorker(true)}
          >
            更新する
          </button>
          <button className={styles.closeButton} onClick={close}>
            後で
          </button>
        </div>
      </div>
    </div>
  );
};
