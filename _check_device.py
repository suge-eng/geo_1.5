with open(r"d:\geo4 - 副本 - 副本 (3) - 副本 - 副本\doubaoapp.py", encoding="utf-8") as f:
    c = f.read()
# 找 uiautomator2 的初始化、设备连接、adb 相关
for kw in ['u2.connect', 'connect', 'adb', 'device', 'init', 'main()', 'def main']:
    idx = 0
    while True:
        idx = c.find(kw, idx)
        if idx == -1: break
        # 只打印前 3 次
        if kw in ('main()', 'def main'): continue
        print(f'{kw} at {idx}: {repr(c[max(0,idx-60):idx+180])}')
        idx += 1
        if idx > 50000: break
    print()
print('=== main 函数完整内容 ===')
idx = c.find('def main()')
# 到 run_worker_loop 或 if __name__
end_loop = c.find('run_worker_loop', idx)
end_main = c.find('if __name__', idx)
end = min(end_loop, end_main) if end_loop > 0 and end_main > 0 else max(end_loop, end_main)
print(c[idx:end+200])
