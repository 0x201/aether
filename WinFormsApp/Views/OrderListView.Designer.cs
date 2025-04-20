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
            idDataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
            CustomerName = new DataGridViewTextBoxColumn();
            OrderDate = new DataGridViewTextBoxColumn();
            orderStatusDataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
            quantityDataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
            totalDataGridViewTextBoxColumn = new DataGridViewTextBoxColumn();
            orderBindingSource = new BindingSource(components);
            ExportButton = new Button();
            ClearButton = new Button();
            FilterTextBox = new TextBox();
            orderBindingSource1 = new BindingSource(components);
            MainPanel.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)OrderDataGridView).BeginInit();
            ((System.ComponentModel.ISupportInitialize)orderBindingSource).BeginInit();
            ((System.ComponentModel.ISupportInitialize)orderBindingSource1).BeginInit();
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
            MainPanel.Name = "MainPanel";
            MainPanel.RowCount = 2;
            MainPanel.RowStyles.Add(new RowStyle());
            MainPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 100F));
            MainPanel.Size = new Size(800, 510);
            MainPanel.TabIndex = 5;
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
            OrderDataGridView.AutoGenerateColumns = false;
            OrderDataGridView.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            OrderDataGridView.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            OrderDataGridView.Columns.AddRange(new DataGridViewColumn[] { idDataGridViewTextBoxColumn, CustomerName, OrderDate, orderStatusDataGridViewTextBoxColumn, quantityDataGridViewTextBoxColumn, totalDataGridViewTextBoxColumn });
            MainPanel.SetColumnSpan(OrderDataGridView, 5);
            OrderDataGridView.DataSource = orderBindingSource;
            OrderDataGridView.Dock = DockStyle.Fill;
            OrderDataGridView.Location = new Point(3, 39);
            OrderDataGridView.Name = "OrderDataGridView";
            OrderDataGridView.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
            OrderDataGridView.Size = new Size(794, 468);
            OrderDataGridView.TabIndex = 0;
            OrderDataGridView.ColumnHeaderMouseClick += OrderDataGridView_ColumnHeaderMouseClick;
            // 
            // idDataGridViewTextBoxColumn
            // 
            idDataGridViewTextBoxColumn.DataPropertyName = "Id";
            idDataGridViewTextBoxColumn.HeaderText = "Id";
            idDataGridViewTextBoxColumn.Name = "idDataGridViewTextBoxColumn";
            // 
            // CustomerName
            // 
            CustomerName.DataPropertyName = "CustomerName";
            CustomerName.HeaderText = "Customer Name";
            CustomerName.Name = "CustomerName";
            // 
            // OrderDate
            // 
            OrderDate.DataPropertyName = "OrderDate";
            OrderDate.HeaderText = "Order Date";
            OrderDate.Name = "OrderDate";
            // 
            // orderStatusDataGridViewTextBoxColumn
            // 
            orderStatusDataGridViewTextBoxColumn.DataPropertyName = "OrderStatus";
            orderStatusDataGridViewTextBoxColumn.HeaderText = "OrderStatus";
            orderStatusDataGridViewTextBoxColumn.Name = "orderStatusDataGridViewTextBoxColumn";
            // 
            // quantityDataGridViewTextBoxColumn
            // 
            quantityDataGridViewTextBoxColumn.DataPropertyName = "Quantity";
            quantityDataGridViewTextBoxColumn.HeaderText = "Quantity";
            quantityDataGridViewTextBoxColumn.Name = "quantityDataGridViewTextBoxColumn";
            // 
            // totalDataGridViewTextBoxColumn
            // 
            totalDataGridViewTextBoxColumn.DataPropertyName = "Total";
            totalDataGridViewTextBoxColumn.HeaderText = "Total";
            totalDataGridViewTextBoxColumn.Name = "totalDataGridViewTextBoxColumn";
            // 
            // orderBindingSource
            // 
            orderBindingSource.DataSource = typeof(ModernCSharp.Domain.Entities.Order);
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
            // FilterTextBox
            // 
            FilterTextBox.Dock = DockStyle.Fill;
            FilterTextBox.Location = new Point(175, 3);
            FilterTextBox.Name = "FilterTextBox";
            FilterTextBox.Size = new Size(450, 23);
            FilterTextBox.TabIndex = 5;
            FilterTextBox.TextChanged += FilterTextBox_TextChanged;
            // 
            // orderBindingSource1
            // 
            orderBindingSource1.DataSource = typeof(ModernCSharp.Domain.Entities.Order);
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
            MainPanel.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)OrderDataGridView).EndInit();
            ((System.ComponentModel.ISupportInitialize)orderBindingSource).EndInit();
            ((System.ComponentModel.ISupportInitialize)orderBindingSource1).EndInit();
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
        private BindingSource orderBindingSource1;
        private DataGridViewTextBoxColumn idDataGridViewTextBoxColumn;
        private DataGridViewTextBoxColumn CustomerName;
        private DataGridViewTextBoxColumn OrderDate;
        private DataGridViewTextBoxColumn orderStatusDataGridViewTextBoxColumn;
        private DataGridViewTextBoxColumn quantityDataGridViewTextBoxColumn;
        private DataGridViewTextBoxColumn totalDataGridViewTextBoxColumn;
    }
}