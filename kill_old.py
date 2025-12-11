cat <<EOF > kill_old.py
import os
import signal

# 取得目前的 PID (避免殺到自己)
my_pid = os.getpid()

print("正在搜尋舊的 app.py 程序...")

# 遍歷 /proc 目錄下的所有程序
for pid in os.listdir('/proc'):
    if pid.isdigit() and int(pid) != my_pid:
        try:
            # 讀取該程序的指令名稱
            with open(f'/proc/{pid}/cmdline', 'r') as f:
                cmd = f.read()
                # 如果發現是 app.py，就殺掉它
                if 'app.py' in cmd:
                    print(f"找到佔用者 PID: {pid} -> 準備殺除")
                    os.kill(int(pid), signal.SIGKILL)
                    print("✅ 已成功殺除！")
        except (IOError, OSError):
            continue
print("清理完成。")
EOF