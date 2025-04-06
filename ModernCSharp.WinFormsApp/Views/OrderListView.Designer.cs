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
            MainPanel = new TableLayoutPanel();
            ClearButton = new Button();
            AppendButton = new Button();
            ExportButton = new Button();
            ImportButton = new Button();
            OrderDataGridView = new DataGridView();
            MainPanel.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)OrderDataGridView).BeginInit();
            SuspendLayout();
            // 
            // MainPanel
            // 
            MainPanel.ColumnCount = 4;
            MainPanel.ColumnStyles.Add(new ColumnStyle());
            MainPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            MainPanel.ColumnStyles.Add(new ColumnStyle());
            MainPanel.ColumnStyles.Add(new ColumnStyle());
            MainPanel.Controls.Add(ClearButton, 2, 0);
            MainPanel.Controls.Add(AppendButton, 1, 0);
            MainPanel.Controls.Add(ExportButton, 3, 0);
            MainPanel.Controls.Add(ImportButton, 0, 0);
            MainPanel.Controls.Add(OrderDataGridView, 0, 1);
            MainPanel.Dock = DockStyle.Fill;
            MainPanel.Location = new Point(0, 0);
            MainPanel.Name = "MainPanel";
            MainPanel.RowCount = 2;
            MainPanel.RowStyles.Add(new RowStyle());
            MainPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 100F));
            MainPanel.Size = new Size(800, 510);
            MainPanel.TabIndex = 5;
            // 
            // ClearButton
            // 
            ClearButton.Location = new Point(631, 3);
            ClearButton.Name = "ClearButton";
            ClearButton.Size = new Size(80, 30);
            ClearButton.TabIndex = 3;
            ClearButton.Text = "Clear";
            ClearButton.UseVisualStyleBackColor = true;
            ClearButton.Click += ClearButton_Click;
            // 
            // AppendButton
            // 
            AppendButton.Location = new Point(89, 3);
            AppendButton.Name = "AppendButton";
            AppendButton.Size = new Size(80, 30);
            AppendButton.TabIndex = 2;
            AppendButton.Text = "Append";
            AppendButton.UseVisualStyleBackColor = true;
            AppendButton.Click += AppendButton_Click;
            // 
            // ExportButton
            // 
            ExportButton.Location = new Point(717, 3);
            ExportButton.Name = "ExportButton";
            ExportButton.Size = new Size(80, 30);
            ExportButton.TabIndex = 4;
            ExportButton.Text = "Export";
            ExportButton.UseVisualStyleBackColor = true;
            ExportButton.Click += ExportButton_Click;
            // 
            // ImportButton
            // 
            ImportButton.Location = new Point(3, 3);
            ImportButton.Name = "ImportButton";
            ImportButton.Size = new Size(80, 30);
            ImportButton.TabIndex = 1;
            ImportButton.Text = "Import";
            ImportButton.UseVisualStyleBackColor = true;
            ImportButton.Click += ImportOrdersButton_Click;
            // 
            // OrderDataGridView
            // 
            OrderDataGridView.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            OrderDataGridView.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            MainPanel.SetColumnSpan(OrderDataGridView, 4);
            OrderDataGridView.Dock = DockStyle.Fill;
            OrderDataGridView.Location = new Point(3, 39);
            OrderDataGridView.Name = "OrderDataGridView";
            OrderDataGridView.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
            OrderDataGridView.Size = new Size(794, 468);
            OrderDataGridView.TabIndex = 0;
            // 
            // OrderListView
            // 
            AutoScaleDimensions = new SizeF(7F, 17F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(800, 510);
            Controls.Add(MainPanel);
            Name = "OrderListView";
            Text = "Order List";
            MainPanel.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)OrderDataGridView).EndInit();
            ResumeLayout(false);
        }

        #endregion

        private TableLayoutPanel MainPanel;
        private Button ImportButton;
        private DataGridView OrderDataGridView;
        private Button AppendButton;
        private Button ClearButton;
        private Button ExportButton;
    }
}