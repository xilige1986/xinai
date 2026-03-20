@echo off
chcp 65001 >nul
echo ==========================================
echo       AI工具平台 - 数据同步工具
echo ==========================================
echo.

set MYSQL_PATH=D:\DTServer\mysql\5.7.26\bin
set LOCAL_DB=ai_tools
set BACKUP_FILE=data_export_%date:~0,4%%date:~5,2%%date:~8,2%.sql

if "%1"=="export" goto export
if "%1"=="import" goto import
if "%1"=="sync" goto sync
goto help

:export
echo 📤 正在导出本地数据...
"%MYSQL_PATH%\mysqldump" -u root -p123456 %LOCAL_DB% ^
  Category SubCategory UseCase Tool Course News SiteSetting ^
  > %BACKUP_FILE%
if %errorlevel% == 0 (
  echo ✅ 导出成功: %BACKUP_FILE%
  echo.
  echo 📊 导出内容:
  "D:\DTServer\mysql\5.7.26\bin\mysql" -u root -p123456 -e "USE ai_tools; SELECT 'Category' as table_name, COUNT(*) as count FROM Category UNION ALL SELECT 'Tool', COUNT(*) FROM Tool UNION ALL SELECT 'Course', COUNT(*) FROM Course;"
) else (
  echo ❌ 导出失败
)
goto end

:import
echo 📥 导入功能需要在线上服务器执行
echo.
echo 操作步骤:
echo 1. 将 %BACKUP_FILE% 上传到服务器
echo 2. 在服务器上执行:
echo    mysql -u ai_tools_user -p ai_tools_platform ^< %BACKUP_FILE%
goto end

:sync
call :export
echo.
echo 📤 请将 %BACKUP_FILE% 上传到服务器 /tmp/ 目录
echo    然后 SSH 到服务器执行导入
goto end

:help
echo 用法: sync-data.bat [命令]
echo.
echo 命令:
echo   export  - 导出本地数据到 SQL 文件
echo   import  - 显示导入说明
echo   sync    - 导出并显示同步说明
echo.
echo 示例:
echo   sync-data.bat export
echo   sync-data.bat sync

:end
echo.
pause
