wysihtml.commands.addTableCells = {
    exec: function(composer, command, value) {
        if (composer.tableSelection && composer.tableSelection.start && composer.tableSelection.end) {
            // switches start and end if start is bigger than end (reverse selection)
            var tableSelect = wysihtml.dom.table.orderSelectionEnds(composer.tableSelection.start, composer.tableSelection.end);
            if (value == 'before' || value == 'above') {
                wysihtml.dom.table.addCells(tableSelect.start, value);
            } else if (value == 'after' || value == 'below') {
                wysihtml.dom.table.addCells(tableSelect.end, value);
            }
            setTimeout(function() {
                composer.tableSelection.select(tableSelect.start, tableSelect.end);
            },0);
        }
    },

    state: function(composer, command) {
        return false;
    }
};

wysihtml.commands.createTable = {
    exec: function(composer, command, value) {
        var col, row, html;
        if (value && value.cols && value.rows && parseInt(value.cols, 10) > 0 && parseInt(value.rows, 10) > 0) {
            if (value.tableStyle) {
                html = '<table style="' + value.tableStyle + '">';
            } else {
                html = '<table>';
            }
            html += '<tbody>';
            for (row = 0; row < value.rows; row ++) {
                html += '<tr>';
                for (col = 0; col < value.cols; col ++) {
                    html += '<td><br></td>';
                }
                html += '</tr>';
            }
            html += '</tbody></table>';
            composer.commands.exec('insertHTML', html);
        }
    },

    state: function(composer, command) {
        return false;
    }
};

wysihtml.commands.deleteTableCells = {
    exec: function(composer, command, value) {
        if (composer.tableSelection && composer.tableSelection.start && composer.tableSelection.end) {
            var tableSelect = wysihtml.dom.table.orderSelectionEnds(composer.tableSelection.start, composer.tableSelection.end),
                idx = wysihtml.dom.table.indexOf(tableSelect.start),
                selCell,
                table = composer.tableSelection.table;

            wysihtml.dom.table.removeCells(tableSelect.start, value);
            setTimeout(function() {
                // move selection to next or previous if not present
                selCell = wysihtml.dom.table.findCell(table, idx);

                if (!selCell) {
                    if (value == 'row') {
                        selCell = wysihtml.dom.table.findCell(table, {
                            'row': idx.row - 1,
                            'col': idx.col
                        });
                    }

                    if (value == 'column') {
                        selCell = wysihtml.dom.table.findCell(table, {
                            'row': idx.row,
                            'col': idx.col - 1
                        });
                    }
                }
                if (selCell) {
                    composer.tableSelection.select(selCell, selCell);
                }
            }, 0);
        }
    },
    state: function(composer, command) {
        return false;
    }
};

wysihtml.commands.mergeTableCells = {
    exec: function(composer, command) {
        if (composer.tableSelection && composer.tableSelection.start && composer.tableSelection.end) {
        if (this.state(composer, command)) {
            wysihtml.dom.table.unmergeCell(composer.tableSelection.start);
        } else {
            wysihtml.dom.table.mergeCellsBetween(composer.tableSelection.start, composer.tableSelection.end);
        }
        }
    },

    state: function(composer, command) {
        if (composer.tableSelection) {
            var start = composer.tableSelection.start,
                end = composer.tableSelection.end;
            if (start && end && start == end &&
                ((
                wysihtml.dom.getAttribute(start, 'colspan') &&
                parseInt(wysihtml.dom.getAttribute(start, 'colspan'), 10) > 1
                ) || (
                wysihtml.dom.getAttribute(start, 'rowspan') &&
                parseInt(wysihtml.dom.getAttribute(start, 'rowspan'), 10) > 1
                ))
            ) {
                return [start];
            }
        }
        return false;
    }
};