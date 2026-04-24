# scripts/data/

個人情報（従業員番号・生年月日）を含むため **git 管理外**（`.gitignore`）。

## employees.json

`seed-employees.ts` が読み込む従業員データ。構造：

```json
[
  {
    "employee_number": "sumita",
    "name": "角田紘一",
    "name_kana": "すみた こういち",
    "location": "天神経営",
    "birthdate": "1988-08-01",
    "is_admin": true
  },
  ...
]
```

## 生成元

中上さんの Excel（パスワード保護・OneDrive 上のクライアント DB）：

```
C:/Users/角田紘一/株式会社天神経営/クライアントデータベース - ドキュメント/
  アワビ_AWB_株式会社鮑屋/
  中上・IAM_正準社員_PT評価対象者(HRBrain_アカウントログインURL一覧）.xlsx
```

シート：
- `2025.10～2026.3_正準社員`（正社員）
- `2025.6_社保PT_対象外`（PT）

管理者 3 名（sumita / hayashi / i-arumas）は別途追加。

## 再生成手順

OneDrive 上の Excel が更新されたら `scripts/regenerate-employees-json.py`（未実装・必要になったら作る）で再生成。
