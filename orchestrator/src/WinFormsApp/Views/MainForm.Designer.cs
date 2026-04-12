namespace Aether.WinFormsApp.Views
{
    partial class MainForm
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
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
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            EditToolStripMenuItem = new ToolStripMenuItem();
            OrdersToolStripMenuItem = new ToolStripMenuItem();
            OrderListToolStripMenuItem1 = new ToolStripMenuItem();
            menuStrip1 = new MenuStrip();
            FileToolStripMenuItem = new ToolStripMenuItem();
            menuStrip1.SuspendLayout();
            SuspendLayout();
            // 
            // EditToolStripMenuItem
            // 
            EditToolStripMenuItem.Name = "EditToolStripMenuItem";
            EditToolStripMenuItem.Size = new Size(42, 21);
            EditToolStripMenuItem.Text = "Edit";
            // 
            // OrdersToolStripMenuItem
            // 
            OrdersToolStripMenuItem.DropDownItems.AddRange(new ToolStripItem[] { OrderListToolStripMenuItem1 });
            OrdersToolStripMenuItem.Name = "OrdersToolStripMenuItem";
            OrdersToolStripMenuItem.Size = new Size(61, 21);
            OrdersToolStripMenuItem.Text = "Orders";
            // 
            // OrderListToolStripMenuItem1
            // 
            OrderListToolStripMenuItem1.Name = "OrderListToolStripMenuItem1";
            OrderListToolStripMenuItem1.Size = new Size(134, 22);
            OrderListToolStripMenuItem1.Text = "Order List";
            OrderListToolStripMenuItem1.Click += OrderListToolStripMenuItem1_Click;
            // 
            // menuStrip1
            // 
            menuStrip1.Items.AddRange(new ToolStripItem[] { FileToolStripMenuItem, EditToolStripMenuItem, OrdersToolStripMenuItem });
            menuStrip1.Location = new Point(0, 0);
            menuStrip1.Name = "menuStrip1";
            menuStrip1.Size = new Size(800, 25);
            menuStrip1.TabIndex = 0;
            menuStrip1.Text = "menuStrip1";
            // 
            // FileToolStripMenuItem
            // 
            FileToolStripMenuItem.Name = "FileToolStripMenuItem";
            FileToolStripMenuItem.Size = new Size(39, 21);
            FileToolStripMenuItem.Text = "File";
            // 
            // MainForm
            // 
            AutoScaleDimensions = new SizeF(7F, 17F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(800, 510);
            Controls.Add(menuStrip1);
            MainMenuStrip = menuStrip1;
            Name = "MainForm";
            Text = "MainForm";
            menuStrip1.ResumeLayout(false);
            menuStrip1.PerformLayout();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion
        private ToolStripMenuItem EditToolStripMenuItem;
        private ToolStripMenuItem OrdersToolStripMenuItem;
        private ToolStripMenuItem OrderListToolStripMenuItem1;
        private MenuStrip menuStrip1;
        private ToolStripMenuItem FileToolStripMenuItem;
    }
}
