function removeUrlParameter(url, paramKey) {
    const r = new URL(url);
    r.searchParams.delete(paramKey);
    return r.href;
  }

  async function progressBar(value, maxValue, size = 12) {
    const progress = Math.round(size * ((value / maxValue) > 1 ? 1 : (value / maxValue)));
    const emptyProgress = size - progress > 0 ? size - progress : 0;
    if (progress === maxValue) return "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜";
    let Fill = `■`
    const progressText = Fill.repeat(progress);
    let Empty = `□`;
    const emptyProgressText = Empty.repeat(emptyProgress);
    var Start = "["
    let End = `]`
    return emptyProgress > 0 ? Start+progressText+emptyProgressText+End : Start+progressText+emptyProgressText+End;
  }

module.exports = { removeUrlParameter,progressBar };