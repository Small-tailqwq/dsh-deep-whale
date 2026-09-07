# 启动错误页双角色素材

2026-09-06，使用内置 OpenAI imagegen，以用户提供的双鲸鱼娘参考图为角色、服装和姿势依据，单次生成 `characters-magenta.png`。原参考图中的价格表不属于素材内容。

`prepare.py` 在画布中线拆分两人，去除首次生成的洋红背景并处理边缘，输出具有真实 alpha 的 `left.webp`、`right.webp` 和源码内嵌模块。没有对生成结果进行再次 imagegen 编辑。素材许可及角色署名见包根目录 `NOTICE` 和 `LICENSE`。

处理命令（需要 Pillow、NumPy、OpenCV）：

```sh
python assets/boot-error/prepare.py
```

最终提示词：

```text
Use the attached ORIGINAL illustration only as reference for both character identities, precise costumes, drawing style and DIFFERENT poses. Create a fresh clean polished anime illustration asset for an application startup error page. TWO full-body blue-haired whale women, independent silhouettes separated by a wide empty gap, left character entirely within left 45% and right character entirely within right 45%, no overlapping. Square canvas. LEFT: tall long wavy blue hair, navy waistcoat over white high collar blouse, long white/navy skirt, gold pocket watch chains, whale brooch and outward left whale tail; upright with one hand gently touching her cheek, slightly embarrassed gentle expression as in reference, other hand relaxed near waist. RIGHT: frilled white maid headband, side braid, navy dress, frilled white apron with whale stationery pocket, gold hem ornaments, outward right whale tail; holds a dark notebook to chest with one arm, other hand lightly near notebook, leaning forward slightly with worried shy expression as reference. Preserve the contrasting heights and poses. Neither performs a formal bow or clasps both hands in apology. Full shoes, tails, hair ahoge all within frame, clear margins. Crisp elegant linework, restrained shading, clean white fabric, coherent fine gold details. Remove the entire sign and all text and tables; render complete bodies. NO UI, lettering, signs, floor, shadows, scenery or checkerboard. Background from FIRST generation must be perfectly uniform solid chroma-key magenta RGB255,0,255 (#FF00FF), including enclosed gaps. No magenta lighting or reflected spill on subjects. This background will be deterministically removed locally to create genuine alpha without re-generating the illustration.
```
