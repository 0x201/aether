using ModernCSharp.Ordering.Application.Queries;

namespace ModernCSharp.WinFormsApp.Views
{
    partial class OrderListView
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            MainPanel = new TableLayoutPanel();
            AppendButton = new Button();
            ImportButton = new Button();
            OrderDataGridView = new DataGridView();
            ordernumberDataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
            dateDataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
            statusDataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
            quantityDataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
            totalDataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
            usernameDataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
            orderBindingSource = new BindingSource(components);
            ExportButton = new Button();
            ClearButton = new Button();
            FilterTextBox = new TextBox();
            MainPanel.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)OrderDataGridView).BeginInit();
            ((System.ComponentModel.ISupportInitialize)orderBindingSource).BeginInit();
            SuspendLayout();
            // 
            // MainPanel
            // 
            MainPanel.ColumnCount = 5;
            MainPanel.ColumnStyles.Add(new ColumnStyle());
            MainPanel.ColumnStyles.Add(new ColumnStyle());
            MainPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            MainPanel.ColumnStyles.Add(new ColumnStyle());
            MainPanel.ColumnStyles.Add(new ColumnStyle());
            MainPanel.Controls.Add(AppendButton, 1, 0);
            MainPanel.Controls.Add(ImportButton, 0, 0);
            MainPanel.Controls.Add(OrderDataGridView, 0, 1);
            MainPanel.Controls.Add(ExportButton, 4, 0);
            MainPanel.Controls.Add(ClearButton, 3, 0);
            MainPanel.Controls.Add(FilterTextBox, 2, 0);
            MainPanel.Dock = DockStyle.Fill;
            MainPanel.Location = new Point(0, 0);
            MainPanel.Margin = new Padding(4, 5, 4, 5);
            MainPanel.Name = "MainPanel";
            MainPanel.RowCount = 2;
            MainPanel.RowStyles.Add(new RowStyle());
            MainPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 100F));
            MainPanel.Size = new Size(1143, 750);
            MainPanel.TabIndex = 5;
            // 
            // AppendButton
            // 
            AppendButton.Location = new Point(126, 5);
            AppendButton.Margin = new Padding(4, 5, 4, 5);
            AppendButton.Name = "AppendButton";
            AppendButton.Size = new Size(114, 43);
            AppendButton.TabIndex = 2;
            AppendButton.Text = "Append";
            AppendButton.UseVisualStyleBackColor = true;
            AppendButton.Click += AppendButton_Click;
            // 
            // ImportButton
            // 
            ImportButton.Location = new Point(4, 5);
            ImportButton.Margin = new Padding(4, 5, 4, 5);
            ImportButton.Name = "ImportButton";
            ImportButton.Size = new Size(114, 43);
            ImportButton.TabIndex = 1;
            ImportButton.Text = "Import";
            ImportButton.UseVisualStyleBackColor = true;
            ImportButton.Click += ImportOrdersButton_Click;
            // 
            // OrderDataGridView
            // 
            OrderDataGridView.AutoGenerateColumns = false;
            OrderDataGridView.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            OrderDataGridView.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            OrderDataGridView.Columns.AddRange(new DataGridViewColumn[] { ordernumberDataGridViewTextBoxColumn, dateDataGridViewTextBoxColumn, statusDataGridViewTextBoxColumn, quantityDataGridViewTextBoxColumn, totalDataGridViewTextBoxColumn, usernameDataGridViewTextBoxColumn });
            MainPanel.SetColumnSpan(OrderDataGridView, 5);
            OrderDataGridView.DataSource = orderBindingSource;
            OrderDataGridView.Dock = DockStyle.Fill;
            OrderDataGridView.Location = new Point(4, 58);
            OrderDataGridView.Margin = new Padding(4, 5, 4, 5);
            OrderDataGridView.Name = "OrderDataGridView";
            OrderDataGridView.RowHeadersWidth = 62;
            OrderDataGridView.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
            OrderDataGridView.Size = new Size(1135, 687);
            OrderDataGridView.TabIndex = 0;
            OrderDataGridView.ColumnHeaderMouseClick += OrderDataGridView_ColumnHeaderMouseClick;
            // 
            // ordernumberDataGridViewTextBoxColumn
            // 
            ordernumberDataGridViewTextBoxColumn.DataPropertyName = "ordernumber";
            ordernumberDataGridViewTextBoxColumn.HeaderText = "Order No.";
            ordernumberDataGridViewTextBoxColumn.MinimumWidth = 8;
            ordernumberDataGridViewTextBoxColumn.Name = "ordernumberDataGridViewTextBoxColumn";
            // 
            // dateDataGridViewTextBoxColumn
            // 
            dateDataGridViewTextBoxColumn.DataPropertyName = "date";
            dateDataGridViewTextBoxColumn.HeaderText = "Order Date";
            dateDataGridViewTextBoxColumn.MinimumWidth = 8;
            dateDataGridViewTextBoxColumn.Name = "dateDataGridViewTextBoxColumn";
            // 
            // statusDataGridViewTextBoxColumn
            // 
            statusDataGridViewTextBoxColumn.DataPropertyName = "status";
            statusDataGridViewTextBoxColumn.HeaderText = "Order Status";
            statusDataGridViewTextBoxColumn.MinimumWidth = 8;
            statusDataGridViewTextBoxColumn.Name = "statusDataGridViewTextBoxColumn";
            // 
            // quantityDataGridViewTextBoxColumn
            // 
            quantityDataGridViewTextBoxColumn.DataPropertyName = "quantity";
            quantityDataGridViewTextBoxColumn.HeaderText = "Quantity";
            quantityDataGridViewTextBoxColumn.MinimumWidth = 8;
            quantityDataGridViewTextBoxColumn.Name = "quantityDataGridViewTextBoxColumn";
            // 
            // totalDataGridViewTextBoxColumn
            // 
            totalDataGridViewTextBoxColumn.DataPropertyName = "total";
            totalDataGridViewTextBoxColumn.HeaderText = "Total";
            totalDataGridViewTextBoxColumn.MinimumWidth = 8;
            totalDataGridViewTextBoxColumn.Name = "totalDataGridViewTextBoxColumn";
            // 
            // usernameDataGridViewTextBoxColumn
            // 
            usernameDataGridViewTextBoxColumn.DataPropertyName = "username";
            usernameDataGridViewTextBoxColumn.HeaderText = "Username";
            usernameDataGridViewTextBoxColumn.MinimumWidth = 8;
            usernameDataGridViewTextBoxColumn.Name = "usernameDataGridViewTextBoxColumn";
            // 
            // orderBindingSource
            // 
            orderBindingSource.DataSource = typeof(Order);
            // 
            // ExportButton
            // 
            ExportButton.Location = new Point(1025, 5);
            ExportButton.Margin = new Padding(4, 5, 4, 5);
            ExportButton.Name = "ExportButton";
            ExportButton.Size = new Size(114, 43);
            ExportButton.TabIndex = 4;
            ExportButton.Text = "Export";
            ExportButton.UseVisualStyleBackColor = true;
            ExportButton.Click += ExportButton_Click;
            // 
            // ClearButton
            // 
            ClearButton.Location = new Point(903, 5);
            ClearButton.Margin = new Padding(4, 5, 4, 5);
            ClearButton.Name = "ClearButton";
            ClearButton.Size = new Size(114, 43);
            ClearButton.TabIndex = 3;
            ClearButton.Text = "Clear";
            ClearButton.UseVisualStyleBackColor = true;
            ClearButton.Click += ClearButton_Click;
            // 
            // FilterTextBox
            // 
            FilterTextBox.Dock = DockStyle.Fill;
            FilterTextBox.Location = new Point(248, 5);
            FilterTextBox.Margin = new Padding(4, 5, 4, 5);
            FilterTextBox.Name = "FilterTextBox";
            FilterTextBox.Size = new Size(647, 31);
            FilterTextBox.TabIndex = 5;
            FilterTextBox.TextChanged += FilterTextBox_TextChanged;
            // 
            // OrderListView
            // 
            AutoScaleDimensions = new SizeF(10F, 25F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1143, 750);
            Controls.Add(MainPanel);
            Margin = new Padding(4, 5, 4, 5);
            Name = "OrderListView";
            Text = "Order List";
            MainPanel.ResumeLayout(false);
            MainPanel.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)OrderDataGridView).EndInit();
            ((System.ComponentModel.ISupportInitialize)orderBindingSource).EndInit();
            ResumeLayout(false);
        }

        #endregion

        private TableLayoutPanel MainPanel;
        private Button ImportButton;
        private DataGridView OrderDataGridView;
        private Button AppendButton;
        private Button ClearButton;
        private Button ExportButton;
        private BindingSource orderBindingSource;
        private TextBox FilterTextBox;
        private DataGridViewTextBoxColumn ordernumberDataGridViewTextBoxColumn;
        private DataGridViewTextBoxColumn dateDataGridViewTextBoxColumn;
        private DataGridViewTextBoxColumn statusDataGridViewTextBoxColumn;
        private DataGridViewTextBoxColumn quantityDataGridViewTextBoxColumn;
        private DataGridViewTextBoxColumn totalDataGridViewTextBoxColumn;
        private DataGridViewTextBoxColumn usernameDataGridViewTextBoxColumn;
    }
}
